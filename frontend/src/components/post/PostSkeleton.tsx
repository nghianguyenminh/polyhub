import React from 'react';

export default function PostSkeleton() {
  return (
    <div className="poly-card bg-white mb-3" style={{ overflow: 'hidden' }}>
      {/* Header Skeleton */}
      <div className="d-flex justify-content-between align-items-center px-3 pt-3 pb-2">
        <div className="d-flex align-items-center gap-2">
          {/* Avatar */}
          <div className="placeholder-glow">
            <div className="placeholder rounded-circle" style={{ width: '44px', height: '44px', backgroundColor: '#e4e6eb' }}></div>
          </div>
          <div className="placeholder-glow d-flex flex-column gap-2">
            {/* Name */}
            <div className="placeholder rounded" style={{ width: '120px', height: '14px', backgroundColor: '#e4e6eb' }}></div>
            {/* Time */}
            <div className="placeholder rounded" style={{ width: '80px', height: '10px', backgroundColor: '#e4e6eb' }}></div>
          </div>
        </div>
        {/* Three dots icon skeleton */}
        <div className="placeholder-glow">
          <div className="placeholder rounded-circle" style={{ width: '36px', height: '36px', backgroundColor: '#e4e6eb' }}></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-3 pb-2 placeholder-glow d-flex flex-column gap-2 mt-2">
        <div className="placeholder rounded" style={{ width: '90%', height: '14px', backgroundColor: '#e4e6eb' }}></div>
        <div className="placeholder rounded" style={{ width: '75%', height: '14px', backgroundColor: '#e4e6eb' }}></div>
        <div className="placeholder rounded" style={{ width: '40%', height: '14px', backgroundColor: '#e4e6eb' }}></div>
      </div>

      {/* Image Skeleton */}
      <div className="placeholder-glow mt-2">
        <div className="placeholder w-100" style={{ height: '300px', backgroundColor: '#e4e6eb' }}></div>
      </div>

      {/* Action Toolbar Skeleton */}
      <div className="px-3 mt-3">
        <hr style={{ margin: '0 0 4px 0', borderColor: 'rgba(0,0,0,0.06)' }} />
      </div>
      <div className="d-flex justify-content-between px-2 pb-1 placeholder-glow">
        <div className="flex-grow-1 p-2">
          <div className="placeholder rounded mx-auto d-block" style={{ width: '60px', height: '20px', backgroundColor: '#e4e6eb' }}></div>
        </div>
        <div className="flex-grow-1 p-2">
          <div className="placeholder rounded mx-auto d-block" style={{ width: '60px', height: '20px', backgroundColor: '#e4e6eb' }}></div>
        </div>
        <div className="flex-grow-1 p-2">
          <div className="placeholder rounded mx-auto d-block" style={{ width: '60px', height: '20px', backgroundColor: '#e4e6eb' }}></div>
        </div>
      </div>
    </div>
  );
}
