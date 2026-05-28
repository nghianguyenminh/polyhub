'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI, API_BASE_URL } from '@/lib/api';
import { Document, Category } from '@/lib/types';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import '@/styles/documents.css';

export default function DocumentsPage() {
  const { user, loading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [docTypeCounts, setDocTypeCounts] = useState<Record<string, number>>({});
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [isFetching, setIsFetching] = useState(true);

  // Upload modal state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCatId, setUploadCatId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // View modal state
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const loadDocuments = async (p = 1) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      params.append('page', p.toString());
      if (keyword) params.append('keyword', keyword);
      if (categoryId) params.append('category_id', categoryId);
      if (documentType) params.append('document_type', documentType);

      const data = await fetchAPI(`/api/documents?${params.toString()}`);
      
      setDocuments(data.documents || []);
      setCategories(data.categories || []);
      setCategoryCounts(data.categoryCounts || {});
      setDocTypeCounts(data.docTypeCounts || {});
      setPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load documents', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadDocuments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, documentType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments(1);
  };

  const handleClearFilters = () => {
    setKeyword('');
    setCategoryId('');
    setDocumentType('');
    loadDocuments(1);
  };

  const handleToggleSave = async (e: React.MouseEvent, docId: number) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await fetchAPI(`/api/saved/posts/${docId}/toggle`, { method: 'POST' }); // Adjust endpoint if needed
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isSaved: !d.isSaved } : d));
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadCatId) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('description', uploadDesc);
      formData.append('categoryId', uploadCatId);
      formData.append('file', uploadFile);

      await fetchAPI('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      // Clear form
      setUploadTitle('');
      setUploadDesc('');
      setUploadCatId('');
      setUploadFile(null);

      // Close modal
      const closeBtn = document.getElementById('closeUploadModal');
      if (closeBtn) closeBtn.click();
      
      loadDocuments(1);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const getDocIconAndClass = (type: string) => {
    switch (type) {
      case 'PDF': return { box: 'bg-danger-soft text-danger', icon: 'bi-file-earmark-pdf-fill' };
      case 'WORD': return { box: 'bg-primary-soft text-primary', icon: 'bi-file-earmark-word-fill' };
      case 'EXCEL': return { box: 'bg-success-soft text-success', icon: 'bi-file-earmark-excel-fill' };
      case 'ZIP': return { box: 'bg-warning-soft text-warning', icon: 'bi-file-earmark-zip-fill' };
      default: return { box: 'bg-info-soft text-info', icon: 'bi-file-earmark-fill' };
    }
  };

  return (
    <>
      <Header />
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="documents" />
          
          <div className="poly-main-feed" style={{ maxWidth: '1000px', width: '100%' }}>
            <form onSubmit={handleSearch} id="filterForm">
              <div className="poly-card p-3 mb-4" style={{ background: 'linear-gradient(to right, #ffffff, #fffaf5)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">Thư viện Tài liệu</h5>
                    <div className="text-muted" style={{ fontSize: '13px' }}>Hơn 5,000+ tài liệu, đề thi, slide bài giảng được chia sẻ</div>
                  </div>
                  <button type="button" className="btn btn-poly-gradient fw-bold rounded-pill px-3 py-2 shadow-sm d-flex align-items-center" style={{ fontSize: '13.5px' }} data-bs-toggle="modal" data-bs-target="#uploadDocModal">
                    <i className="bi bi-cloud-arrow-up-fill me-2 fs-5"></i> Chia sẻ tài liệu
                  </button>
                </div>
                
                <div className="input-group mt-3 shadow-sm" style={{ borderRadius: '50rem', border: '1px solid rgba(242, 113, 37, 0.2)', background: 'white' }}>
                  <span className="input-group-text bg-transparent border-0 text-poly ps-3 pe-2 py-2">
                    <i className="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="form-control bg-transparent border-0 py-2 shadow-none" 
                    style={{ fontSize: '13.5px' }} 
                    placeholder="Tìm kiếm theo mã môn (vd: SOF3021), tên tài liệu, chuyên ngành..."
                  />
                  <button type="submit" className="btn btn-poly-gradient px-4 fw-bold py-2" style={{ borderRadius: '0 50rem 50rem 0', fontSize: '13.5px' }}>Tìm kiếm</button>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 mb-4 overflow-visible">
                <button type="button" onClick={handleClearFilters} className="filter-coursera shadow-sm fw-bold text-dark border-0">
                  <i className="bi bi-arrow-clockwise"></i> Xoá lọc
                </button>
                <div className="vr mx-1 opacity-25"></div> 
                
                <div className="dropdown">
                  <button className={`filter-coursera dropdown-toggle ${categoryId ? 'bg-poly text-white border-poly' : ''}`} type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                    Chuyên ngành <i className="bi bi-chevron-down ms-1" style={{ fontSize: '11px' }}></i>
                  </button>
                  <div className="dropdown-menu coursera-dropdown-menu shadow">
                    <div className="coursera-filter-header">Chọn Chuyên ngành</div>
                    <div className="coursera-filter-body">
                      {categories.map(cat => (
                        <div className="form-check custom-radio mb-2" key={cat.id}>
                          <input 
                            className="form-check-input shadow-none" 
                            type="radio" 
                            name="category_id" 
                            id={`d_cn_${cat.id}`} 
                            value={cat.id} 
                            checked={categoryId === cat.id.toString()}
                            onChange={(e) => setCategoryId(e.target.value)}
                          />
                          <label className="form-check-label d-flex justify-content-between w-100" htmlFor={`d_cn_${cat.id}`}>
                            <span className="text-truncate" style={{ maxWidth: '85%' }}>{cat.name}</span>
                            <span className="text-muted" style={{ fontSize: '11.5px' }}>({categoryCounts[cat.id] || 0})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="coursera-filter-footer">
                      <label className="btn btn-link btn-sm text-muted text-decoration-none fw-medium m-0 p-0" onClick={() => setCategoryId('')} style={{ cursor: 'pointer', color: '#6c757d' }}>Bỏ chọn</label>
                    </div>
                  </div>
                </div>

                <div className="dropdown">
                  <button className={`filter-coursera dropdown-toggle ${documentType ? 'bg-poly text-white border-poly' : ''}`} type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                    Loại tài liệu <i className="bi bi-chevron-down ms-1" style={{ fontSize: '11px' }}></i>
                  </button>
                  <div className="dropdown-menu coursera-dropdown-menu shadow">
                    <div className="coursera-filter-header">Định dạng file</div>
                    <div className="coursera-filter-body">
                      {['PDF', 'WORD', 'EXCEL', 'OTHER'].map(type => (
                        <div className="form-check custom-radio mb-2" key={type}>
                          <input 
                            className="form-check-input shadow-none" 
                            type="radio" 
                            name="document_type" 
                            id={`type-${type}`} 
                            value={type} 
                            checked={documentType === type}
                            onChange={(e) => setDocumentType(e.target.value)}
                          />
                          <label className="form-check-label d-flex justify-content-between w-100" htmlFor={`type-${type}`}>
                            <span>{type === 'WORD' ? 'Word (DOC/DOCX)' : type === 'EXCEL' ? 'Excel (XLS/XLSX)' : type === 'OTHER' ? 'Khác' : type}</span> 
                            <span className="text-muted" style={{ fontSize: '11.5px' }}>({docTypeCounts[type] || 0})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="coursera-filter-footer">
                      <label className="btn btn-link btn-sm text-muted text-decoration-none fw-medium m-0 p-0" onClick={() => setDocumentType('')} style={{ cursor: 'pointer', color: '#6c757d' }}>Bỏ chọn</label>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-3 mb-4">
              {isFetching ? (
                <div className="col-12 text-center my-5">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="col-12 text-center my-5 text-muted">
                  Không tìm thấy tài liệu nào phù hợp.
                </div>
              ) : (
                documents.map(doc => {
                  const { box, icon } = getDocIconAndClass(doc.documentType);
                  return (
                    <div className="col" key={doc.id}>
                      <div 
                        className="doc-card h-100 d-flex flex-column position-relative" 
                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} 
                        data-bs-toggle="modal" 
                        data-bs-target="#viewDocModal"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className={`doc-icon-box ${box}`}>
                            <i className={`bi ${icon}`}></i>
                          </div> 
                          <button 
                            type="button" 
                            className={`btn-icon-transparent z-3 position-relative border-0 bg-transparent ${doc.isSaved ? 'text-poly' : 'text-muted'}`}
                            onClick={(e) => handleToggleSave(e, doc.id)}
                          >
                            <i className={`bi ${doc.isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                          </button>
                        </div>
                        
                        <div className="mb-2 flex-grow-1">
                          <span className="badge bg-light text-dark border mb-2 fw-normal">{doc.category?.name || 'Tài liệu'}</span>
                          <h6 className="doc-title text-dark">{doc.title}</h6>
                        </div>
                        
                        <div className="doc-meta text-muted mb-3 d-flex align-items-center">
                          <img 
                            src={doc.uploader?.avatar && doc.uploader.avatar !== 'default.png' ? doc.uploader.avatar : `https://ui-avatars.com/api/?name=${doc.uploader?.fullname || 'PolyHub'}&background=random`} 
                            className="rounded-circle me-2 object-fit-cover" 
                            width="22" 
                            height="22" 
                            alt="avatar" 
                          />
                          <span className="text-truncate fw-medium text-dark" style={{ fontSize: '13px' }}>{doc.uploader?.fullname || 'Hệ thống'}</span>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top z-3 position-relative">
                          <div className="text-muted" style={{ fontSize: '11.5px' }}><i className="bi bi-download me-1"></i> <span>{doc.downloadCount || 0}</span></div>
                          <a 
                            href={`${API_BASE_URL}/api/documents/download/${doc.id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()} 
                            className="btn btn-download btn-sm rounded-pill fw-bold"
                          >
                            Tải về
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!isFetching && totalPages > 1 && (
              <nav aria-label="Page navigation">
                <ul className="pagination poly-pagination justify-content-center mt-4 mb-5">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadDocuments(page - 1)} disabled={page === 1}><i className="bi bi-chevron-left"></i></button>
                  </li>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <li className={`page-item ${page === i + 1 ? 'active' : ''}`} key={i}>
                      <button className="page-link" onClick={() => loadDocuments(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadDocuments(page + 1)} disabled={page === totalPages}><i className="bi bi-chevron-right"></i></button>
                  </li>
                </ul>
              </nav>
            )}

          </div>
        </main>
      </div>

      {/* MODAL UPLOAD TÀI LIỆU */}
      <div className="modal fade" id="uploadDocModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content" style={{ borderRadius: '20px', border: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
            <div className="modal-header pb-2 border-0 position-relative mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <h5 className="modal-title fw-bolder w-100 text-center" style={{ fontSize: '1.35rem', letterSpacing: '-0.4px', color: '#1c1e21' }}>
                <i className="bi bi-cloud-upload-fill me-2" style={{ color: 'var(--poly-orange, #f27125)' }}></i>Chia sẻ Tài liệu mới
              </h5>
              <div className="btn-close-custom position-absolute" data-bs-dismiss="modal" id="closeUploadModal" style={{ right: '18px', top: '12px', background: '#f1f3f5', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="bi bi-x fs-4 text-muted"></i>
              </div>
            </div>
            
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body pt-3 pb-4 px-4">
                <div className="row g-4">
                  <div className="col-md-12">
                    <label className="form-label" style={{ fontSize: '14.5px', fontWeight: 600 }}>Tên tài liệu / Tiêu đề <span className="text-danger">*</span></label>
                    <input type="text" className="form-control trendy-input" placeholder="Ví dụ: Đề thi thử SOF3021, Slide Thuyết trình Agile..." required value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label" style={{ fontSize: '14.5px', fontWeight: 600 }}>Mô tả ngắn</label>
                    <textarea className="form-control trendy-input" rows={3} placeholder="Ghi chú thêm về nội dung tài liệu để mọi người dễ dàng tìm kiếm..." style={{ resize: 'none' }} value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '14.5px', fontWeight: 600 }}>Chuyên ngành / Nhóm ngành <span className="text-danger">*</span></label>
                    <select className="form-select trendy-input dropdown-icon" required value={uploadCatId} onChange={e => setUploadCatId(e.target.value)}>
                      <option value="" disabled>-- Chọn chuyên ngành --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontSize: '14.5px', fontWeight: 600 }}>Tệp đính kèm <span className="text-danger">*</span></label>
                    <input type="file" className="form-control trendy-input file-input-trendy" required accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                    <small className="text-muted mt-1 d-block" style={{ fontSize: '11.5px', opacity: 0.85 }}>Hỗ trợ: PDF, Word, Excel, PPT, ZIP, RAR.</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex gap-2 justify-content-end">
                <button type="button" className="btn fw-semibold rounded-pill px-4 py-2" data-bs-dismiss="modal" style={{ backgroundColor: '#f1f3f5', color: '#050505', border: 'none' }}>Hủy bỏ</button>
                <button type="submit" className="btn fw-bold rounded-pill px-4 py-2 text-white" disabled={isUploading} style={{ background: 'linear-gradient(135deg, var(--poly-orange, #f27125), #ff8a47)' }}>
                  {isUploading ? 'Đang tải...' : 'Đăng tải lên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT TÀI LIỆU */}
      <div className="modal fade" id="viewDocModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow" style={{ borderRadius: '16px', overflow: 'hidden', background: 'linear-gradient(145deg, #ffffff, #fdfbf7)' }}>
            {selectedDoc && (
              <>
                <div className="modal-header border-0 pb-0 position-relative mt-2 px-4 pt-4">
                  <div className="d-flex align-items-center justify-content-between w-100">
                    <span className="badge bg-light text-dark border px-3 py-2 fw-medium" style={{ borderRadius: '8px' }}>{selectedDoc.category?.name || 'Tài liệu'}</span>
                    <div className="btn-close-custom" data-bs-dismiss="modal" style={{ cursor: 'pointer', background: '#f8f9fa', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-x fs-5 text-dark"></i>
                    </div>
                  </div>
                </div>
                
                <div className="modal-body px-4 py-3">
                  <div className="d-flex mb-3">
                    <div className={`doc-icon-box me-3 mt-1 d-flex align-items-center justify-content-center ${getDocIconAndClass(selectedDoc.documentType).box}`} style={{ width: '48px', height: '48px', borderRadius: '12px', fontSize: '24px' }}>
                      <i className={`bi ${getDocIconAndClass(selectedDoc.documentType).icon}`}></i>
                    </div>
                    <div>
                      <h4 className="fw-bolder mb-1" style={{ color: '#1a1a1a', lineHeight: 1.35 }}>{selectedDoc.title}</h4>
                      <div className="d-flex flex-wrap text-muted align-items-center gap-3" style={{ fontSize: '13px' }}>
                        <span><i className="bi bi-clock me-1"></i> <span>{selectedDoc.createdAt ? new Date(selectedDoc.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}</span></span>
                        <span><i className="bi bi-file-earmark-text me-1"></i> <span>{selectedDoc.documentType}</span></span>
                        <span><i className="bi bi-download me-1"></i> <span>{selectedDoc.downloadCount || 0}</span> Lượt tải</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 mb-4 mt-2" style={{ background: 'rgba(242, 113, 37, 0.04)', border: '1px solid rgba(242, 113, 37, 0.1)', borderRadius: '12px' }}>
                    <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '13.5px' }}>Mô tả tài liệu:</h6>
                    <p className="mb-0 text-muted" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                      {selectedDoc.description || 'Chưa có mô tả cho tài liệu này.'}
                    </p>
                  </div>
                  
                  <hr className="border-light" />
                  
                  <div className="d-flex align-items-center justify-content-between mt-2 mb-2">
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Người chia sẻ</p>
                      <div className="d-flex align-items-center">
                        <img 
                          src={selectedDoc.uploader?.avatar && selectedDoc.uploader.avatar !== 'default.png' ? selectedDoc.uploader.avatar : `https://ui-avatars.com/api/?name=${selectedDoc.uploader?.fullname || 'PolyHub'}&background=random`} 
                          className="rounded-circle me-2 object-fit-cover shadow-sm border border-white" 
                          width="36" height="36" alt="uploader"
                        />
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '14px', lineHeight: 1.2 }}>{selectedDoc.uploader?.fullname || 'Hệ thống'}</div>
                          <span className="badge bg-poly-soft text-poly mt-1" style={{ fontSize: '10px', padding: '3px 6px' }}>Sinh viên</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex">
                  <a href={`${API_BASE_URL}/api/documents/download/${selectedDoc.id}`} target="_blank" rel="noreferrer" className="btn btn-poly-gradient fw-bold rounded-pill w-100 py-2 d-flex justify-content-center align-items-center" style={{ fontSize: '15px' }}>
                    <i className="bi bi-cloud-arrow-down-fill me-2 fs-5"></i> Tải Xuống Tài Liệu
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .trendy-input {
          border: 1.5px solid #e9ecef;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 15px;
          transition: all 0.3s ease;
          background-color: #fafbfc !important;
          color: #2b2d31;
        }
        .trendy-input:focus {
          border-color: rgba(242, 113, 37, 0.5);
          box-shadow: 0 0 0 4px rgba(242, 113, 37, 0.1);
          background-color: #ffffff !important;
        }
      `}</style>
    </>
  );
}
