'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';

interface CoinTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface CoinHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onRefreshUser?: () => void;
}

export default function CoinHistoryModal({ isOpen, onClose, coins, onRefreshUser }: CoinHistoryModalProps) {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [msg, setMsg] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/api/bookings/coins/transactions');
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load coin transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
      setMsg('');
    }
  }, [isOpen]);

  const handleGrantCoins = async () => {
    setGranting(true);
    setMsg('');
    try {
      const res = await fetchAPI('/api/bookings/coins/grant-100', { method: 'POST' });
      setMsg(res.message || 'Đã cấp 100 xu thành công!');
      loadTransactions();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setMsg(err.message || 'Lỗi cấp xu');
    } finally {
      setGranting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1065 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #F27125, #FF9E67)', border: 'none' }}>
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <span>🪙</span> Lịch Sử Giao Dịch Xu Call Video
            </h5>
            <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose} />
          </div>

          <div className="modal-body p-4">
            <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-3" style={{ background: '#fff7ed', border: '1px solid #ffedd5' }}>
              <div>
                <div className="text-muted fs-7">Số dư xu khả dụng</div>
                <div className="fs-3 fw-extrabold text-orange" style={{ color: '#ea580c' }}>
                  🪙 {coins} Xu
                </div>
              </div>
              <button
                className="btn btn-warning text-dark fw-bold rounded-pill px-3 py-2 btn-sm shadow-sm"
                onClick={handleGrantCoins}
                disabled={granting}
              >
                {granting ? 'Đang nạp...' : '🎁 Cấp lại 100 Xu'}
              </button>
            </div>

            {msg && (
              <div className="alert alert-info py-2 px-3 fs-7 mb-3 rounded-3">
                {msg}
              </div>
            )}

            <h6 className="fw-bold mb-2 fs-7 text-secondary text-uppercase" style={{ letterSpacing: '0.5px' }}>
              Nhật ký biến động xu
            </h6>

            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center py-4 text-muted">Đang tải lịch sử xu...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-muted fs-7">Chưa có giao dịch xu nào.</div>
              ) : (
                transactions.map(tx => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div key={tx.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                      <div>
                        <div className="fw-bold text-dark fs-7">{tx.description || tx.type}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className={`fw-extrabold fs-6 ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? `+${tx.amount}` : tx.amount} Xu
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="modal-footer border-0 p-3 bg-light">
            <button type="button" className="btn btn-secondary rounded-pill px-4 fw-bold shadow-none" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
