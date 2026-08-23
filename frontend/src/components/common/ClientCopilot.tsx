'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function ClientCopilot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Chào bạn! Mình là PolyHUB Copilot. Mình có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);


  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetchAPI('/api/chatbot', {
        method: 'POST',
        body: JSON.stringify({ message: userText })
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.reply }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Xin lỗi bạn, hệ thống AI đang gặp sự cố: ' + (error.message || 'Lỗi không xác định') }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Hide on auth and admin pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot-password')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      zIndex: 9999
    }}>
      {/* Nút Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--poly-orange, #F27125), #ff8a47) ',
            border: 'none',
            color: '#fff', fontSize: '28px', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(242, 113, 37, 0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-robot"></i>
        </button>
      )}

      {/* Cửa sổ Chat */}
      {isOpen && (
        <div style={{
          width: '360px', height: '500px', backgroundColor: '#fff',
          borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid #eee'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--poly-orange, #F27125), #ff8a47)',
            color: '#fff',
            padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-robot"></i>
              </div>
              <h6 style={{ margin: 0, fontWeight: 700 }}>Trợ Lý Poly</h6>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9f9f9' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: msg.role === 'user' ? 'var(--poly-orange, #F27125)' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#1C1E21',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                boxShadow: msg.role === 'ai' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                fontSize: '14.5px',
                lineHeight: '1.5'
              }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#fff', padding: '10px 14px', borderRadius: '16px 16px 16px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div className="spinner-grow spinner-grow-sm text-secondary me-1" role="status"></div>
                <div className="spinner-grow spinner-grow-sm text-secondary me-1" role="status"></div>
                <div className="spinner-grow spinner-grow-sm text-secondary" role="status"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid #eee', backgroundColor: '#fff', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: '24px', border: '1px solid #ddd',
                outline: 'none', fontSize: '14px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !inputValue.trim()}
              style={{
                background: inputValue.trim() ? 'var(--poly-orange, #F27125 --poly-orange-hover)' : '#e4e6eb',
                color: inputValue.trim() ? '#fff' : '#bcc0c4',
                border: 'none', borderRadius: '50%', width: '42px', height: '42px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
