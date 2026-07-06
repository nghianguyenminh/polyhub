import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface MentorBadgeProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function MentorBadge({ size = 16, className = '', style }: MentorBadgeProps) {
  return (
    <span
      className={`mentor-badge ${className}`}
      title="Chuyên gia / Mentor được hệ thống xác thực"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#3b82f6', // blue-500 for a Facebook-like verified badge
        marginLeft: '4px',
        verticalAlign: 'text-bottom',
        ...style
      }}
    >
      <BadgeCheck size={size} fill="currentColor" stroke="#fff" strokeWidth={1.5} />
    </span>
  );
}
