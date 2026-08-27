'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import Header from '@/components/layout/Header';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import { useRouter } from 'next/navigation';

function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingDeposit, setPendingDeposit] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  // Bank Info provided by user
  const BANK_ID = 'TPB';
  const ACCOUNT_NO = '00004077150';
  const ACCOUNT_NAME = 'NGUYEN HUNG THINH';

  const loadBalance = async () => {
    try {
      const data = await fetchAPI('/api/wallet/balance');
      setBalance(data.balance || 0);
    } catch (err) {
      console.error('Lỗi khi tải số dư', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await fetchAPI('/api/wallet/transactions');
      setTransactions(data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử', err);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadBalance();
      loadTransactions();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-poly" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.showError('Số tiền rút không hợp lệ');
      return;
    }
    if (Number(withdrawAmount) > balance) {
      toast.showError('Số dư không đủ');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn rút ${Number(withdrawAmount).toLocaleString('vi-VN')} đ? (Phí rút 10%)`)) {
      return;
    }

    try {
      const res = await fetchAPI('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(withdrawAmount) })
      });
      toast.showSuccess(`Rút thành công! Nhận được: ${res.netAmount.toLocaleString('vi-VN')} đ (Thuế: ${res.tax.toLocaleString('vi-VN')} đ)`);
      setBalance(res.remainingBalance);
      setWithdrawAmount('');
      loadTransactions();
    } catch (err: any) {
      toast.showError(err.message || 'Lỗi khi rút tiền');
    }
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) < 10000) {
      toast.showError('Số tiền nạp tối thiểu là 10.000 VNĐ');
      return;
    }

    try {
      const res = await fetchAPI('/api/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(depositAmount) })
      });
      setPendingDeposit(res);
      toast.showSuccess('Đã tạo yêu cầu nạp tiền, vui lòng quét mã QR');
      loadTransactions();
    } catch (err: any) {
      toast.showError(err.message || 'Lỗi khi tạo yêu cầu nạp tiền');
    }
  };

  const handleConfirmMock = async () => {
    if (!pendingDeposit) return;
    setConfirming(true);
    try {
      const res = await fetchAPI(`/api/wallet/deposit/${pendingDeposit.id}/confirm`, {
        method: 'POST'
      });
      toast.showSuccess(`Mô phỏng thanh toán thành công! Số dư mới: ${res.newBalance.toLocaleString('vi-VN')} đ`);
      setBalance(res.newBalance);
      setPendingDeposit(null);
      setDepositAmount('');
      loadTransactions();
    } catch (err: any) {
      toast.showError(err.message || 'Lỗi xác nhận nạp tiền');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <Header />
      <div className="app-container">
        <main className="w-100 d-flex justify-content-between">
          <LeftSidebar activeMenu="wallet" />

          <div className="poly-main-feed" style={{ maxWidth: '850px' }}>
            <div className="poly-card bg-white p-3 mb-4">
              <h4 className="fw-bold mb-4"><i className="bi bi-wallet2 text-poly me-2"></i> Ví của tôi</h4>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-poly" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="text-center bg-light rounded-3 p-4 mb-4 border shadow-sm">
                  <p className="text-muted mb-1 fw-medium">Số dư hiện tại</p>
                  <h2 className="text-poly fw-bold mb-0">{balance.toLocaleString('vi-VN')} đ</h2>
                </div>
              )}

              {/* Tabs */}
              <ul className="nav nav-tabs mb-4 border-bottom-0 gap-2">
                <li className="nav-item">
                  <button
                    className={`nav-link fw-bold px-4 py-2 border-0 rounded-pill ${activeTab === 'deposit' ? 'bg-poly text-white shadow-sm' : 'bg-light text-muted'}`}
                    onClick={() => setActiveTab('deposit')}
                  >
                    Nạp tiền
                  </button>
                </li>
                {user?.role === 'MENTOR' && (
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-bold px-4 py-2 border-0 rounded-pill ${activeTab === 'withdraw' ? 'bg-poly text-white shadow-sm' : 'bg-light text-muted'}`}
                      onClick={() => setActiveTab('withdraw')}
                    >
                      Rút tiền
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className={`nav-link fw-bold px-4 py-2 border-0 rounded-pill ${activeTab === 'history' ? 'bg-poly text-white shadow-sm' : 'bg-light text-muted'}`}
                    onClick={() => setActiveTab('history')}
                  >
                    Lịch sử giao dịch
                  </button>
                </li>
              </ul>

              {/* Deposit Tab */}
              {activeTab === 'deposit' && (
                <div className="border rounded-3 p-4 bg-white shadow-sm" style={{ borderColor: 'rgba(242, 113, 37, 0.3)' }}>
                  <h5 className="fw-bold mb-3 text-poly"><i className="bi bi-box-arrow-in-down me-2"></i>Nạp tiền vào ví</h5>

                  {!pendingDeposit ? (
                    <form onSubmit={handleCreateDeposit}>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Số tiền cần nạp (VND)</label>
                        <input
                          type="number"
                          className="form-control form-control-lg"
                          placeholder="Tối thiểu 10,000 đ"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          min="10000"
                        />
                      </div>
                      <button type="submit" className="btn btn-poly-gradient text-white btn-lg w-100 fw-bold" disabled={!depositAmount || Number(depositAmount) < 10000}>
                        Tạo mã nạp tiền
                      </button>
                    </form>
                  ) : (
                    <div className="text-center">
                      <div className="alert alert-warning mb-4 shadow-sm border-0">
                        <strong>Mã giao dịch:</strong> <span className="text-danger fw-bold">{pendingDeposit.txCode}</span> <br />
                        <strong>Số tiền:</strong> {pendingDeposit.amount.toLocaleString('vi-VN')} VND
                      </div>
                      <p className="mb-2 fw-medium text-dark fs-5">Mở App Ngân hàng bất kỳ để quét mã QR:</p>

                      <div className="d-flex justify-content-center mb-4">
                        <div className="p-3 border rounded-4 bg-white shadow d-inline-block">
                          <img
                            src={`https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.jpg?amount=${pendingDeposit.amount}&addInfo=${pendingDeposit.txCode}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`}
                            alt="VietQR"
                            style={{ width: '280px', height: 'auto', borderRadius: '8px' }}
                          />
                        </div>
                      </div>

                      <hr className="my-4" />

                      <div className="p-3 bg-light rounded text-start mb-3 border">
                        <h6 className="fw-bold text-danger mb-2"><i className="bi bi-shield-check me-1"></i>Dành cho Demo / Hackathon</h6>
                        <p className="small text-muted mb-3">Vì đây là môi trường thử nghiệm và không có Webhook từ ngân hàng thực, vui lòng bấm nút bên dưới để mô phỏng rằng bạn đã thanh toán thành công.</p>
                        <button onClick={handleConfirmMock} disabled={confirming} className="btn btn-poly-gradient text-white btn-lg w-100 fw-bold shadow-sm">
                          {confirming ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang xác nhận...</>
                          ) : (
                            <><i className="bi bi-check-circle-fill me-2"></i>Tôi đã chuyển khoản thành công</>
                          )}
                        </button>
                      </div>

                      <button onClick={() => setPendingDeposit(null)} className="btn btn-link text-muted fw-bold btn-sm mt-2">
                        Hủy giao dịch này
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Withdraw Tab */}
              {activeTab === 'withdraw' && user?.role === 'MENTOR' && (
                <div className="border rounded-3 p-4 bg-white shadow-sm" style={{ borderColor: 'rgba(242, 113, 37, 0.3)' }}>
                  <h5 className="fw-bold mb-3 text-poly"><i className="bi bi-box-arrow-up me-2"></i>Rút tiền (Dành cho Mentor)</h5>
                  <p className="text-muted small mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Lưu ý: Hệ thống sẽ thu 10% phí / thuế khi bạn thực hiện rút tiền.
                  </p>
                  <form onSubmit={handleWithdraw}>
                    <div className="mb-3">
                      <label className="form-label fw-medium">Số tiền cần rút (VND)</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        placeholder="Ví dụ: 100000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                        min="10000"
                        max={balance}
                      />
                    </div>
                    {withdrawAmount && Number(withdrawAmount) > 0 && Number(withdrawAmount) <= balance && (
                      <div className="alert alert-warning py-2 small border-0 shadow-sm">
                        <div>Số tiền rút: {Number(withdrawAmount).toLocaleString('vi-VN')} đ</div>
                        <div>Phí 10%: {(Number(withdrawAmount) * 0.1).toLocaleString('vi-VN')} đ</div>
                        <div className="fw-bold text-poly mt-1">Thực nhận: {(Number(withdrawAmount) * 0.9).toLocaleString('vi-VN')} đ</div>
                      </div>
                    )}
                    <button type="submit" className="btn btn-poly-gradient text-white btn-lg w-100 fw-bold shadow-sm" disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > balance}>
                      Thực hiện rút tiền
                    </button>
                  </form>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="border rounded-3 p-0 bg-white shadow-sm overflow-hidden">
                  <div className="p-3 bg-light border-bottom">
                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-clock-history me-2"></i>Lịch sử giao dịch</h5>
                  </div>
                  {transactions.length === 0 ? (
                    <div className="p-5 text-center text-muted">
                      <i className="bi bi-inbox fs-1 mb-2 d-block text-secondary"></i>
                      Chưa có giao dịch nào
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0 align-middle">
                        <thead className="table-light text-secondary small">
                          <tr>
                            <th className="px-4 py-3">Mã GD</th>
                            <th className="py-3">Loại</th>
                            <th className="py-3">Số tiền</th>
                            <th className="py-3">Thời gian</th>
                            <th className="py-3">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx: any) => (
                            <tr key={tx.id}>
                              <td className="px-4 py-3 fw-medium text-muted">{tx.txCode}</td>
                              <td>
                                {tx.type === 'DEPOSIT' ? (
                                  <span className="badge bg-poly text-white border rounded-pill px-3 py-2" style={{ borderColor: 'var(--poly-primary)' }}>Nạp tiền</span>
                                ) : (
                                  <span className="badge bg-danger text-white border border-danger-subtle rounded-pill px-3 py-2">Rút tiền</span>
                                )}
                              </td>
                              <td className="fw-bold fs-6">
                                {tx.type === 'DEPOSIT' ? (
                                  <span className="text-poly">+{tx.amount.toLocaleString('vi-VN')} đ</span>
                                ) : (
                                  <span className="text-danger">-{tx.amount.toLocaleString('vi-VN')} đ</span>
                                )}
                              </td>
                              <td className="text-muted small">
                                {new Date(tx.createdAt).toLocaleString('vi-VN')}
                              </td>
                              <td>
                                {tx.status === 'SUCCESS' ? (
                                  <span className="text-poly fw-medium"><i className="bi bi-check-circle-fill me-1"></i>Thành công</span>
                                ) : (
                                  <span className="text-warning fw-medium"><i className="bi bi-hourglass-split me-1"></i>Chờ xử lý</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          <RightSidebar />
        </main>
      </div>
    </>
  );
}

export default WalletPage;
