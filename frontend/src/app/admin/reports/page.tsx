"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { Suspense } from "react";

function AdminReportsContent() {
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    resolved: 0,
    falseCount: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "danger";
  } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Modal states
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get("page");

  useEffect(() => {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(page);
    loadReports(page);
  }, [pageParam]);

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

  const loadReports = async (page: number) => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/api/admin/reports?page=${page}`);
      setReports(data.reports || []);
      setTotalPages(data.totalPages || 1);
      setStats({
        pending: data.pendingCount || 0,
        resolved: data.resolvedCount || 0,
        falseCount: data.falseCount || 0,
      });
    } catch (err: any) {
      console.error("Failed to fetch reports", err);
      setMessage({
        text: err.message || "Lỗi tải danh sách báo cáo vi phạm",
        type: "danger",
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    router.push(`/admin/reports?page=${page}`);
  };

  const handleApprove = async (id: number) => {
    if (
      !confirm(
        "Hành động này sẽ XÓA bài viết và xử lý báo cáo. Bạn có chắc không?",
      )
    )
      return;
    try {
      const result = await fetchAPI(`/api/admin/reports/${id}/approve`, {
        method: "POST",
      });
      setMessage({ text: result.message, type: "success" });
      if (showDetailModal) setShowDetailModal(false);
      loadReports(currentPage);
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi xử lý báo cáo", type: "danger" });
    }
  };

  const handleReject = async (id: number) => {
    if (
      !confirm("Từ chối báo cáo này (Báo cáo sai sự thật)? Báo cáo sẽ bị xóa.")
    )
      return;
    try {
      const result = await fetchAPI(`/api/admin/reports/${id}/reject`, {
        method: "POST",
      });
      setMessage({ text: result.message, type: "success" });
      if (showDetailModal) setShowDetailModal(false);
      loadReports(currentPage);
    } catch (err: any) {
      setMessage({
        text: err.message || "Lỗi từ chối báo cáo",
        type: "danger",
      });
    }
  };

  const handleWarn = async (id: number) => {
    if (
      !confirm(
        "Gửi cảnh báo yêu cầu chỉnh sửa/xóa bài viết đến người dùng? Họ có 2 ngày để thực hiện.",
      )
    )
      return;
    try {
      const result = await fetchAPI(`/api/admin/reports/${id}/warn`, {
        method: "POST",
      });
      setMessage({ text: result.message, type: "success" });
      if (showDetailModal) setShowDetailModal(false);
      loadReports(currentPage);
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi gửi cảnh báo", type: "danger" });
    }
  };

  const handleRequestLock = async (id: number) => {
    if (
      !confirm(
        "Gửi yêu cầu khóa tài khoản người dùng vi phạm đến Ban quản lý Người dùng?",
      )
    )
      return;
    try {
      const result = await fetchAPI(`/api/admin/reports/${id}/request-lock`, {
        method: "POST",
      });
      setMessage({ text: result.message, type: "success" });
      if (showDetailModal) setShowDetailModal(false);
      loadReports(currentPage);
    } catch (err: any) {
      setMessage({
        text: err.message || "Lỗi gửi yêu cầu khóa",
        type: "danger",
      });
    }
  };

  const handleResolveDocument = async (id: number) => {
    if (
      !confirm(
        "Hành động này sẽ GỠ tài liệu vi phạm khỏi hệ thống. Bạn có chắc không?",
      )
    )
      return;
    try {
      const result = await fetchAPI(
        `/api/admin/reports/documents/${id}/resolve`,
        { method: "POST" },
      );
      setMessage({ text: result.message, type: "success" });
      if (showDetailModal) setShowDetailModal(false);
      loadReports(currentPage);
    } catch (err: any) {
      setMessage({
        text: err.message || "Lỗi xử lý báo cáo tài liệu",
        type: "danger",
      });
    }
  };

  const handleDismissDocument = async (id: number) => {
    if (!confirm("Từ chối báo cáo này (Tài liệu không vi phạm)?")) return;
    try {
      const result = await fetchAPI(
        `/api/admin/reports/documents/${id}/dismiss`,
        { method: "POST" },
      );
      setMessage({ text: result.message, type: "success" });
      if (showDetailModal) setShowDetailModal(false);
      loadReports(currentPage);
    } catch (err: any) {
      setMessage({
        text: err.message || "Lỗi từ chối báo cáo tài liệu",
        type: "danger",
      });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol
              className="breadcrumb mb-1 text-uppercase text-muted"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              <li className="breadcrumb-item">
                <Link href="/admin" className="text-decoration-none text-muted">
                  Trang chủ
                </Link>
              </li>
              <li className="breadcrumb-item">
                <span className="text-muted">Kiểm soát</span>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Báo cáo vi phạm
              </li>
            </ol>
          </nav>
          <h3
            className="fw-bold mb-0 text-dark"
            style={{ letterSpacing: "-0.5px" }}
          >
            Xử lý Báo cáo
          </h3>
        </div>
      </div>

      {message && (
        <div
          className="d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 border-start border-4 shadow-sm"
          style={{
            backgroundColor: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
            borderColor: message.type === "success" ? "#22C55E" : "#EF4444",
            color: message.type === "success" ? "#166534" : "#991B1B",
            animation: "polyFadeIn 0.3s ease-out",
          }}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${message.type === "success" ? "bi-check-circle-fill text-success" : "bi-exclamation-circle-fill text-danger"} fs-5`}
            ></i>
            <span className="fw-semibold" style={{ fontSize: "14px" }}>
              {message.text}
            </span>
          </div>
          <button
            type="button"
            className="btn border-0 p-1 d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: "24px",
              height: "24px",
              color: message.type === "success" ? "#166534" : "#991B1B",
              opacity: 0.7,
              cursor: "pointer",
            }}
            onClick={() => setMessage(null)}
          >
            <i className="bi bi-x-lg" style={{ fontSize: "12px" }}></i>
          </button>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="poly-card p-3 bg-white rounded-3 shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="text-muted fw-medium" style={{ fontSize: "13px" }}>
              Đang chờ xử lý
            </div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.pending}</h3>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="poly-card p-3 bg-white rounded-3 shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="text-muted fw-medium" style={{ fontSize: "13px" }}>
              Đã xử lý (Xóa bài)
            </div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.resolved}</h3>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="poly-card p-3 bg-white rounded-3 shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="text-muted fw-medium" style={{ fontSize: "13px" }}>
              Từ Chối Xóa Bài{" "}
            </div>
            <h3 className="fw-bold text-dark mt-1 mb-0">{stats.falseCount}</h3>
          </div>
        </div>
      </div>

      <div className="table-container bg-white rounded-3 shadow-sm border border-light overflow-hidden mb-4">
        <div className="table-responsive">
          <table
            className="table table-hover mb-0 align-middle"
            style={{ fontSize: "13.5px" }}
          >
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">
                  Nội dung báo cáo
                </th>
                <th scope="col">Người bị báo cáo</th>
                <th scope="col">Người báo cáo</th>
                <th scope="col">Ngày gửi</th>
                <th scope="col" className="text-end pe-4">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <div className="spinner-border text-primary" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    Không có báo cáo vi phạm nào.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const isDocument = report.type === "DOCUMENT";
                  const targetUser = isDocument
                    ? report.document?.user
                    : report.post?.user;
                  return (
                    <tr key={`${report.type}-${report.id}`}>
                      <td className="ps-4 py-3">
                        <div className="fw-semibold text-danger mb-1 d-flex align-items-center gap-2 flex-wrap">
                          <i
                            className={`bi ${isDocument ? "bi-file-earmark-x-fill" : "bi-exclamation-triangle-fill"} me-1`}
                          ></i>{" "}
                          {report.reason}
                          {isDocument && (
                            <span
                              className="badge bg-info text-white"
                              style={{ fontSize: "10px", fontWeight: 600 }}
                            >
                              Tài liệu
                            </span>
                          )}
                          {report.status === "WARNED" && (
                            <span
                              className="badge bg-warning text-dark"
                              style={{ fontSize: "10px", fontWeight: 600 }}
                            >
                              Đã cảnh báo
                            </span>
                          )}
                          {report.status === "LOCK_REQUESTED" && (
                            <span
                              className="badge bg-danger text-white"
                              style={{ fontSize: "10px", fontWeight: 600 }}
                            >
                              Y/C khóa acc
                            </span>
                          )}
                          {(report.status === "PENDING" || !report.status) && (
                            <span
                              className="badge bg-secondary text-white"
                              style={{ fontSize: "10px", fontWeight: 600 }}
                            >
                              Chờ xử lý
                            </span>
                          )}
                        </div>
                        <div
                          className="text-muted text-truncate"
                          style={{ maxWidth: "300px", fontSize: "12px" }}
                        >
                          {isDocument
                            ? `Tài liệu: ${report.document?.title || "Đã bị xóa"}`
                            : `Bài viết: ${report.post?.content || "Đã bị xóa"}`}
                        </div>
                      </td>
                      <td>
                        {targetUser ? (
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={
                                targetUser.avatar &&
                                targetUser.avatar !== "default.png"
                                  ? targetUser.avatar
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.fullname)}`
                              }
                              className="rounded-circle"
                              width="24"
                              height="24"
                              alt="avatar"
                              style={{ objectFit: "cover" }}
                            />
                            <span className="fw-medium text-dark">
                              {targetUser.fullname}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">
                            Không rõ
                          </span>
                        )}
                      </td>
                      <td>
                        {report.reporter ? (
                          <span className="text-muted">
                            {report.reporter.fullname}
                          </span>
                        ) : (
                          <span className="text-muted">Ẩn danh</span>
                        )}
                      </td>
                      <td className="text-muted">
                        {new Date(report.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailModal(true);
                          }}
                          className="btn btn-sm btn-outline-primary me-2"
                          title="Xem chi tiết báo cáo"
                        >
                          <i className="bi bi-eye"></i> Chi tiết
                        </button>
                        <button
                          onClick={() =>
                            isDocument
                              ? handleDismissDocument(report.id)
                              : handleReject(report.id)
                          }
                          className="btn btn-sm btn-outline-secondary"
                          title="Từ chối (Báo cáo sai)"
                        >
                          <i className="bi bi-x-circle"></i> Từ chối
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light bg-opacity-50">
            <div className="text-muted" style={{ fontSize: "13px" }}>
              Trang hiện tại: <b>{currentPage}</b> / <b>{totalPages}</b>
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link shadow-none"
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Trang trước
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <li
                      key={page}
                      className={`page-item ${currentPage === page ? "active" : ""}`}
                    >
                      <button
                        className="page-link shadow-none"
                        style={
                          currentPage === page
                            ? {
                                backgroundColor: "#4F46E5",
                                borderColor: "#4F46E5",
                              }
                            : {}
                        }
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ),
                )}
                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                >
                  <button
                    className="page-link shadow-none"
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Trang tiếp
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* --- Detail Modal --- */}
      {showDetailModal && selectedReport && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 1050,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetailModal(false);
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg border-0"
            style={{
              width: "100%",
              maxWidth: "680px",
              margin: "0 16px",
              overflow: "hidden",
              animation: "polyFadeIn 0.2s ease-out",
            }}
          >
            {/* Modal Header */}
            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-light">
              <h5
                className="fw-bold mb-0 text-dark"
                style={{ fontSize: "17px" }}
              >
                Chi tiết báo cáo vi phạm #{selectedReport.id}
              </h5>
              <button
                className="btn border-0 rounded-circle p-0 d-flex align-items-center justify-content-center bg-white shadow-sm"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setShowDetailModal(false)}
              >
                <i className="bi bi-x fs-5"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-auto" style={{ maxHeight: "65vh" }}>
              {/* Section 1: Report Reason */}
              <div className="mb-4">
                <h6
                  className="fw-bold text-uppercase text-muted mb-2"
                  style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                >
                  Thông tin báo cáo
                </h6>
                <div className="p-3 bg-light rounded-3 border-start border-4 border-danger">
                  <div className="fw-bold text-danger mb-1">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> Lý
                    do: {selectedReport.reason}
                  </div>
                  <div className="text-muted" style={{ fontSize: "13px" }}>
                    Người báo cáo:{" "}
                    <span className="fw-semibold text-dark">
                      {selectedReport.reporter?.fullname || "Ẩn danh"}
                    </span>{" "}
                    (@{selectedReport.reporter?.username || "anonymous"})
                  </div>
                  <div className="text-muted" style={{ fontSize: "13px" }}>
                    Ngày gửi:{" "}
                    {new Date(selectedReport.createdAt).toLocaleString("vi-VN")}
                  </div>
                  <div className="mt-2">
                    Trạng thái:{" "}
                    {selectedReport.status === "WARNED" ? (
                      <span className="badge bg-warning text-dark">
                        Đã gửi email cảnh báo (Hạn 2 ngày)
                      </span>
                    ) : selectedReport.status === "LOCK_REQUESTED" ? (
                      <span className="badge bg-danger text-white">
                        Đã gửi yêu cầu khóa tài khoản
                      </span>
                    ) : (
                      <span className="badge bg-secondary text-white">
                        Chờ xử lý
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedReport.type === "DOCUMENT" ? (
                <>
                  {/* Section 2 (Document): Reported document */}
                  <div className="mb-4">
                    <h6
                      className="fw-bold text-uppercase text-muted mb-2"
                      style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                    >
                      Tài liệu bị báo cáo
                    </h6>
                    <div className="p-3 border rounded-3 bg-white">
                      {selectedReport.document ? (
                        <>
                          <div
                            className="fw-semibold text-dark mb-1"
                            style={{ fontSize: "14px" }}
                          >
                            <i className="bi bi-file-earmark-text me-2"></i>
                            {selectedReport.document.title}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "12px" }}
                          >
                            Loại tài liệu:{" "}
                            {selectedReport.document.documentType}
                          </div>
                        </>
                      ) : (
                        <div className="text-muted fst-italic">
                          Tài liệu này đã bị xóa hoặc không tồn tại.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 3 (Document): Uploader info */}
                  <div className="mb-2">
                    <h6
                      className="fw-bold text-uppercase text-muted mb-2"
                      style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                    >
                      Thông tin người bị báo cáo (Người tải lên)
                    </h6>
                    {selectedReport.document?.user ? (
                      <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                        <img
                          src={
                            selectedReport.document.user.avatar &&
                            selectedReport.document.user.avatar !==
                              "default.png"
                              ? selectedReport.document.user.avatar
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReport.document.user.fullname)}`
                          }
                          className="rounded-circle border"
                          width="48"
                          height="48"
                          alt="avatar"
                          style={{ objectFit: "cover" }}
                        />
                        <div>
                          <div className="fw-bold text-dark">
                            {selectedReport.document.user.fullname}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "13px" }}
                          >
                            Username: @{selectedReport.document.user.username}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "13px" }}
                          >
                            Email:{" "}
                            {selectedReport.document.user.email ||
                              "Không có email"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted fst-italic">
                        Không rõ thông tin người tải lên.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Section 2 (Post): Reported post */}
                  <div className="mb-4">
                    <h6
                      className="fw-bold text-uppercase text-muted mb-2"
                      style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                    >
                      Nội dung bài viết bị báo cáo
                    </h6>
                    <div className="p-3 border rounded-3 bg-white">
                      {selectedReport.post ? (
                        <>
                          <div
                            className="text-dark mb-3"
                            style={{
                              fontSize: "14px",
                              whiteSpace: "pre-wrap",
                              lineHeight: "1.6",
                            }}
                          >
                            {selectedReport.post.content}
                          </div>
                          {selectedReport.post.imageUrl && (
                            <div
                              className="mb-3 rounded-2 overflow-hidden border text-center bg-light"
                              style={{ maxHeight: "250px" }}
                            >
                              <img
                                src={selectedReport.post.imageUrl}
                                alt="post attachment"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "250px",
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          )}
                          <div
                            className="text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            Đăng lúc:{" "}
                            {new Date(
                              selectedReport.post.createdAt,
                            ).toLocaleString("vi-VN")}
                          </div>
                        </>
                      ) : (
                        <div className="text-muted fst-italic">
                          Bài viết này đã bị xóa hoặc không tồn tại.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 3 (Post): Reported person info */}
                  <div className="mb-2">
                    <h6
                      className="fw-bold text-uppercase text-muted mb-2"
                      style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                    >
                      Thông tin người bị báo cáo (Tác giả)
                    </h6>
                    {selectedReport.post?.user ? (
                      <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                        <img
                          src={
                            selectedReport.post.user.avatar &&
                            selectedReport.post.user.avatar !== "default.png"
                              ? selectedReport.post.user.avatar
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReport.post.user.fullname)}`
                          }
                          className="rounded-circle border"
                          width="48"
                          height="48"
                          alt="avatar"
                          style={{ objectFit: "cover" }}
                        />
                        <div>
                          <div className="fw-bold text-dark">
                            {selectedReport.post.user.fullname}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "13px" }}
                          >
                            Username: @{selectedReport.post.user.username}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "13px" }}
                          >
                            Email:{" "}
                            {selectedReport.post.user.email || "Không có email"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted fst-italic">
                        Không rõ thông tin tác giả.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-top bg-light d-flex justify-content-between flex-wrap gap-2">
              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
              <div className="d-flex gap-2">
                {selectedReport.type === "DOCUMENT" ? (
                  <>
                    <button
                      onClick={() => handleDismissDocument(selectedReport.id)}
                      className="btn btn-sm btn-outline-secondary"
                      title="Từ chối báo cáo này (Tài liệu không vi phạm)"
                    >
                      Từ chối
                    </button>
                    {selectedReport.document && (
                      <button
                        onClick={() => handleResolveDocument(selectedReport.id)}
                        className="btn btn-sm btn-danger"
                        title="Gỡ tài liệu vi phạm ngay lập tức"
                      >
                        Gỡ tài liệu
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleReject(selectedReport.id)}
                      className="btn btn-sm btn-outline-secondary"
                      title="Từ chối báo cáo này (Báo cáo sai)"
                    >
                      Từ chối
                    </button>
                    {selectedReport.post && (
                      <button
                        onClick={() => handleApprove(selectedReport.id)}
                        className="btn btn-sm btn-danger"
                        title="Xóa bài viết vi phạm ngay lập tức"
                      >
                        Xóa bài
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-center">
          <div className="spinner-border text-primary" />
        </div>
      }
    >
      <AdminReportsContent />
    </Suspense>
  );
}
