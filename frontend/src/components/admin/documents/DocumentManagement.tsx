"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  FileText,
  FileText as FileGeneric,
  Check,
  X,
  ShieldOff,
  RotateCcw,
  Trash2,
  Eye,
} from "lucide-react";
import { fetchAPI } from "@/lib/api";
import styles from "./DocumentManagement.module.css";

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function DocumentManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [documents, setDocuments] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    text: string;
    type: "Success" | "Danger" | "Warning";
  } | null>(null);

  // States cho Custom Modal "Takedown/Reject"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [takedownReason, setTakedownReason] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  // States cho vai trò người dùng và Modal Chi tiết tài liệu
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  // Lấy params ra khỏi URL
  const pageParam = searchParams.get("page");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("category_id") || "",
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [hasLoadedCategories, setHasLoadedCategories] = useState(false);

  useEffect(() => {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const catParam = searchParams.get("category_id") || "";
    setCurrentPage(page);
    setCategoryId(catParam);
    loadDocuments(
      page,
      searchParams.get("keyword") || "",
      searchParams.get("status") || "",
      catParam,
    );
  }, [pageParam, searchParams]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await fetchAPI("/api/auth/me");
        if (currentUser) {
          setCurrentUserRole(currentUser.role);
        }
      } catch (err) {
        console.error("Failed to load current user role:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  const loadDocuments = async (
    page: number,
    currentKeyword: string,
    currentStatus: string,
    currentCategoryId: string = categoryId,
  ) => {
    setLoading(true);
    try {
      const pageSize = 5;
      let url = `/api/admin/documents?page=${page}&size=${pageSize}`;

      if (currentKeyword)
        url += `&keyword=${encodeURIComponent(currentKeyword)}`;
      if (currentStatus) url += `&status=${currentStatus}`;
      if (currentCategoryId) url += `&category_id=${currentCategoryId}`;
      if (!hasLoadedCategories) url += `&include_categories=true`;

      const res = await fetchAPI(url);

      // Quét sâu hơn để xử lý trường hợp Backend có bọc ApiResponse (res.data.content)
      const documentList =
        res.documents || res.data?.content || res.content || [];
      const totalPagesCount = res.totalPages || res.data?.totalPages || 1;

      setDocuments(documentList);
      setTotalPages(totalPagesCount);

      if (!hasLoadedCategories && res.categories) {
        setCategories(res.categories);
        setHasLoadedCategories(true);
      }
    } catch (err: any) {
      console.error("Failed to fetch documents", err);
      setMessage({
        text: err.message || "Lỗi tải danh sách tài liệu",
        type: "Danger",
      });
      setDocuments([]); // Làm sạch state nếu API lỗi để tránh crash bảng
    } finally {
      setLoading(false);
    }
  };

  // Áp dụng bộ lọc (Đẩy lên URL params)
  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (keyword) params.set("keyword", keyword);
    if (status) params.set("status", status);
    if (categoryId) params.set("category_id", categoryId);
    router.push(`/admin/documents?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/documents?${params.toString()}`);
  };

  // --- Core Business Logic actions ---
  const handleApprove = async (id: number) => {
    try {
      const result = await fetchAPI(`/api/admin/documents/${id}/approve`, {
        method: "POST",
      });
      setMessage({ text: result.message, type: "Success" });
      loadDocuments(currentPage, keyword, status);
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi duyệt tài liệu", type: "Danger" });
    }
  };

  const openTakedownModal = (id: number) => {
    setSelectedDocId(id);
    setTakedownReason("");
    setIsModalOpen(true);
  };

  const handleTakedown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !takedownReason.trim()) return;

    try {
      const result = await fetchAPI(
        `/api/admin/documents/${selectedDocId}/hidden`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: takedownReason }),
        },
      );
      setMessage({ text: result.message, type: "Warning" });
      setIsModalOpen(false);
      loadDocuments(currentPage, keyword, status);
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi từ chối/gỡ", type: "Danger" });
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const result = await fetchAPI(`/api/admin/documents/${id}/restore`, {
        method: "POST",
      });
      setMessage({ text: result.message, type: "Success" });
      loadDocuments(currentPage, keyword, status);
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi phục hồi", type: "Danger" });
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này? Lệnh này không thể khôi phục!",
      )
    )
      return;
    try {
      const result = await fetchAPI(`/api/admin/documents/${id}/delete`, {
        method: "POST",
      });
      setMessage({ text: result.message, type: "Success" });
      loadDocuments(currentPage, keyword, status);
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi xóa vĩnh viễn", type: "Danger" });
    }
  };

  // --- UI Helpers ---
  const getStatusBadge = (docStatus: string) => {
    switch (docStatus) {
      case "PENDING":
        return (
          <span className={`${styles.badge} ${styles.badgePending}`}>
            Chờ duyệt
          </span>
        );
      case "APPROVED":
        return (
          <span className={`${styles.badge} ${styles.badgeApproved}`}>
            Đã duyệt
          </span>
        );
      case "REJECTED":
        return (
          <span className={`${styles.badge} ${styles.badgeRejected}`}>
            Từ chối
          </span>
        );
      case "TAKEDOWN":
        return (
          <span className={`${styles.badge} ${styles.badgeTakedown}`}>
            Tạm gỡ
          </span>
        );
      default:
        return <span className={styles.badge}>{docStatus}</span>;
    }
  };

  const getDocIcon = (type: string) => {
    if (type === "PDF")
      return (
        <div className={`${styles.docIcon} ${styles.iconPdf}`}>
          <FileText size={20} />
        </div>
      );
    if (type === "DOCX")
      return (
        <div className={`${styles.docIcon} ${styles.iconDoc}`}>
          <FileText size={20} />
        </div>
      );
    return (
      <div className={`${styles.docIcon} ${styles.iconGeneric}`}>
        <FileGeneric size={20} />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý Tài liệu</h1>
          <p className={styles.pageSubtitle}>
            Phê duyệt, kiểm soát và gỡ bỏ tài liệu trên nền tảng.
          </p>
        </div>
      </header>

      {/* Messages */}
      {message && (
        <div className={`${styles.alert} ${styles[`alert${message.type}`]}`}>
          <span>{message.text}</span>
          <button
            className={styles.closeAlert}
            onClick={() => setMessage(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu hoặc tác giả..."
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>

          <select
            className={styles.selectInput}
            value={status}
            onChange={(e) => {
              const val = e.target.value;
              setStatus(val);
              const params = new URLSearchParams();
              params.set("page", "1");
              if (keyword.trim()) params.set("keyword", keyword.trim());
              if (val) params.set("status", val);
              if (categoryId) params.set("category_id", categoryId);
              router.push(`/admin/documents?${params.toString()}`);
            }}
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="TAKEDOWN">Tạm gỡ</option>
          </select>

          <select
            className={styles.selectInput}
            value={categoryId}
            onChange={(e) => {
              const val = e.target.value;
              setCategoryId(val);
              const params = new URLSearchParams();
              params.set("page", "1");
              if (keyword.trim()) params.set("keyword", keyword.trim());
              if (status) params.set("status", status);
              if (val) params.set("category_id", val);
              router.push(`/admin/documents?${params.toString()}`);
            }}
          >
            <option value="">Tất cả Chuyên ngành</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tài liệu & Tác giả</th>
                <th>Phân loại</th>
                <th>Tải về</th>
                <th>Trạng thái</th>
                <th>Ngày đăng</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "48px" }}
                  >
                    <span style={{ color: "#4F46E5", fontWeight: 500 }}>
                      Đang tải dữ liệu...
                    </span>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "48px",
                      color: "#6b7280",
                    }}
                  >
                    Không tìm thấy tài liệu phù hợp.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className={
                      doc.status === "REJECTED" || doc.status === "TAKEDOWN"
                        ? styles.rowRejected
                        : ""
                    }
                  >
                    <td>
                      <div className={styles.docInfo}>
                        {getDocIcon(doc.documentType)}
                        <div className={styles.docDetails}>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.docTitle}
                          >
                            {doc.title}
                          </a>
                          <span className={styles.docAuthor}>
                            Bởi:{" "}
                            {doc.uploader?.fullname || doc.uploader?.username}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#111827" }}>
                        {doc.documentType}
                      </div>
                      <div className={styles.categoryText}>
                        {doc.category?.name || "Chưa phân loại"}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "#4b5563" }}>
                      {doc.downloadCount}
                    </td>
                    <td>{getStatusBadge(doc.status)}</td>
                    <td className={styles.categoryText}>
                      {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className={`${styles.btnAction} ${styles.btnDetail}`}
                          title="Chi tiết"
                        >
                          <Eye size={16} /> Chi tiết
                        </button>

                        {(currentUserRole === "SUPER_ADMIN" ||
                          currentUserRole === "ADMIN" ||
                          currentUserRole === "CONTENT_ADMIN") && (
                          <>
                            {doc.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApprove(doc.id)}
                                  className={`${styles.btnAction} ${styles.btnApprove}`}
                                  title="Duyệt"
                                >
                                  <Check size={16} /> Duyệt
                                </button>
                                <button
                                  onClick={() => openTakedownModal(doc.id)}
                                  className={`${styles.btnAction} ${styles.btnReject}`}
                                  title="Từ chối"
                                >
                                  <X size={16} /> Từ chối
                                </button>
                              </>
                            )}
                            {doc.status === "APPROVED" && (
                              <button
                                onClick={() => openTakedownModal(doc.id)}
                                className={`${styles.btnAction} ${styles.btnWarning}`}
                                title="Gỡ tài liệu"
                              >
                                <ShieldOff size={16} /> Gỡ
                              </button>
                            )}
                            {(doc.status === "REJECTED" ||
                              doc.status === "TAKEDOWN") && (
                              <>
                                <button
                                  onClick={() => handleRestore(doc.id)}
                                  className={`${styles.btnAction} ${styles.btnRestore}`}
                                  title="Khôi phục"
                                >
                                  <RotateCcw size={16} /> Khôi phục
                                </button>
                                <button
                                  onClick={() => handleDelete(doc.id)}
                                  className={`${styles.btnAction} ${styles.btnReject}`}
                                  title="Xóa vĩnh viễn"
                                >
                                  <Trash2 size={16} /> Xóa
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        {/* Custom Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>
            Trang <strong>{currentPage}</strong> / {totalPages}
          </div>
          <div className={styles.pageControls}>
            <button
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ""}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ),
            )}
            <button
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Tiếp
            </button>
          </div>
        </div>
      )}

      {/* Custom Take down Modal (replaces Bootstrap Modal) */}
      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>Từ chối / Gỡ tài liệu</div>
            <form onSubmit={handleTakedown}>
              <div className={styles.modalBody}>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    marginBottom: "16px",
                  }}
                >
                  Tài liệu này sẽ bị ẩn khỏi hệ thống. Vui lòng cung cấp lý do
                  (sẽ được gửi tới tác giả).
                </p>
                <label className={styles.modalLabel}>Lý do</label>
                <textarea
                  className={styles.modalTextarea}
                  required
                  placeholder="Nhập lý do tại đây..."
                  value={takedownReason}
                  onChange={(e) => setTakedownReason(e.target.value)}
                />
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalBtnCancel}
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.modalBtnSubmit}>
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewingDoc && (
        <div
          className={styles.modalOverlay}
          onClick={() => setViewingDoc(null)}
        >
          <div
            className={`${styles.modalContent} ${styles.detailModalContent}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>Chi tiết tài liệu</div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItemFull}>
                  <label className={styles.detailLabel}>Tiêu đề</label>
                  <div className={styles.detailValueTitle}>
                    {viewingDoc.title}
                  </div>
                </div>

                <div className={styles.detailItemFull}>
                  <label className={styles.detailLabel}>Mô tả</label>
                  <div className={styles.detailValueDescription}>
                    {viewingDoc.description || (
                      <em style={{ color: "#9ca3af" }}>Không có mô tả</em>
                    )}
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Định dạng</label>
                    <div className={styles.detailValue}>
                      {viewingDoc.documentType}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Dung lượng</label>
                    <div className={styles.detailValue}>
                      {formatFileSize(viewingDoc.fileSize)}
                    </div>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Lượt tải xuống</label>
                    <div className={styles.detailValue}>
                      {viewingDoc.downloadCount}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Chuyên ngành</label>
                    <div className={styles.detailValue}>
                      {viewingDoc.category?.name || (
                        <em style={{ color: "#9ca3af" }}>Chưa phân loại</em>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Người đăng</label>
                    <div className={styles.detailValue}>
                      {viewingDoc.uploader?.fullname ||
                        viewingDoc.uploader?.username || (
                          <em style={{ color: "#9ca3af" }}>Ẩn danh</em>
                        )}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Ngày đăng</label>
                    <div className={styles.detailValue}>
                      {new Date(viewingDoc.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Trạng thái</label>
                    <div>{getStatusBadge(viewingDoc.status)}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Đường dẫn</label>
                    <div>
                      <a
                        href={viewingDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.detailLink}
                      >
                        Mở/Tải tài liệu
                      </a>
                    </div>
                  </div>
                </div>

                {(viewingDoc.status === "REJECTED" ||
                  viewingDoc.status === "TAKEDOWN") && (
                  <div
                    className={styles.detailItemFull}
                    style={{ marginTop: "12px" }}
                  >
                    <label
                      className={`${styles.detailLabel} ${styles.labelDanger}`}
                    >
                      Lý do từ chối / gỡ bỏ
                    </label>
                    <div className={styles.detailValueReason}>
                      {viewingDoc.rejectionReason || (
                        <em style={{ color: "#9ca3af" }}>
                          Không có lý do chi tiết
                        </em>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalBtnCancel}
                onClick={() => setViewingDoc(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
