'use client';

import React, { Suspense } from 'react';
import Header from '@/components/layout/Header';
import '@/styles/chat.css';
import dynamic from 'next/dynamic';

const ChatContent = dynamic(() => import('@/components/chat/ChatContent'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 'calc(100vh - 60px)',
        marginTop: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #F0F2F5',
          borderTop: '3px solid #F27125',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  ),
});

export default function ChatPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div
            style={{
              height: 'calc(100vh - 60px)',
              marginTop: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #F0F2F5',
                borderTop: '3px solid #F27125',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        }
      >
        <ChatContent />
      </Suspense>
    </>
  );
}
