'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './ClockPicker.module.css';

interface ClockPickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  label?: string;
  id?: string;
}

export default function ClockPicker({ value, onChange, label, id }: ClockPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'hours' | 'minutes'>('hours');
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Parse initial value
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [isPM, setIsPM] = useState(false);

  // Refs for tracking latest state values in global handlers
  const hoursRef = useRef(hours);
  const minutesRef = useRef(minutes);
  const isPMRef = useRef(isPM);
  const activeModeRef = useRef(activeMode);

  hoursRef.current = hours;
  minutesRef.current = minutes;
  isPMRef.current = isPM;
  activeModeRef.current = activeMode;

  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(':');
      const h = parseInt(hStr, 10) || 0;
      const m = parseInt(mStr, 10) || 0;
      setHours(h === 0 ? 12 : h > 12 ? h - 12 : h);
      setMinutes(m);
      setIsPM(h >= 12);
    }
  }, [value]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTime = (newHours: number, newMinutes: number, pm: boolean) => {
    let rawHours = newHours;
    if (newHours === 12) {
      rawHours = pm ? 12 : 0;
    } else {
      rawHours = pm ? newHours + 12 : newHours;
    }
    const hStr = String(rawHours).padStart(2, '0');
    const mStr = String(newMinutes).padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  // Drag and spin logic
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;

      let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      const currentMode = activeModeRef.current;
      const currentHours = hoursRef.current;
      const currentMinutes = minutesRef.current;
      const currentPM = isPMRef.current;

      if (currentMode === 'hours') {
        let hour = Math.round(angle / 30) % 12;
        if (hour === 0) hour = 12;
        if (hour !== currentHours) {
          setHours(hour);
          updateTime(hour, currentMinutes, currentPM);
        }
      } else {
        const minute = Math.round(angle / 6) % 60;
        if (minute !== currentMinutes) {
          setMinutes(minute);
          updateTime(currentHours, minute, currentPM);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handleInitialClickOrTouch = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const currentMode = activeModeRef.current;
    const currentHours = hoursRef.current;
    const currentMinutes = minutesRef.current;
    const currentPM = isPMRef.current;

    if (currentMode === 'hours') {
      let hour = Math.round(angle / 30) % 12;
      if (hour === 0) hour = 12;
      setHours(hour);
      updateTime(hour, currentMinutes, currentPM);
    } else {
      const minute = Math.round(angle / 6) % 60;
      setMinutes(minute);
      updateTime(currentHours, minute, currentPM);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    handleInitialClickOrTouch(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      handleInitialClickOrTouch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleNumberClick = (num: number) => {
    if (activeMode === 'hours') {
      setHours(num);
      updateTime(num, minutes, isPM);
    } else {
      setMinutes(num);
      updateTime(hours, num, isPM);
    }
  };

  const adjustValue = (amount: number) => {
    if (activeMode === 'hours') {
      let nextHour = hours + amount;
      if (nextHour > 12) nextHour = 1;
      if (nextHour < 1) nextHour = 12;
      setHours(nextHour);
      updateTime(nextHour, minutes, isPM);
    } else {
      let nextMin = minutes + amount;
      if (nextMin >= 60) nextMin = 0;
      if (nextMin < 0) nextMin = 59;
      setMinutes(nextMin);
      updateTime(hours, nextMin, isPM);
    }
  };

  const toggleAMPM = (pm: boolean) => {
    setIsPM(pm);
    updateTime(hours, minutes, pm);
  };

  // Layout calculations for 12 positions around the clock circle
  const getPosition = (index: number) => {
    // 12 is at top (index 0), 1 is at 30 deg (index 1), etc.
    const angle = (index * 30 * Math.PI) / 180;
    const radius = 70; // px
    const x = 100 + radius * Math.sin(angle); // 100px is center offset (50% of 200px dial)
    const y = 100 - radius * Math.cos(angle);
    return { left: `${x}px`, top: `${y}px` };
  };

  // Calculate hand rotation
  const getHandRotation = () => {
    if (activeMode === 'hours') {
      return (hours % 12) * 30;
    } else {
      return minutes * 6; // 360 / 60 = 6 deg per minute
    }
  };

  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className={styles.clockPickerContainer} ref={pickerRef}>
      {label && <label className={styles.inputLabel}>{label}</label>}
      <div 
        className={styles.timeDisplayInput} 
        onClick={() => setIsOpen(!isOpen)}
        id={id}
      >
        <span className={styles.timeText}>{value || '00:00'}</span>
        <i className="bi bi-clock-fill styles.clockIcon" style={{ color: '#f27125' }} />
      </div>

      {isOpen && (
        <div className={styles.clockDropdown}>
          {/* Digital Readout Header */}
          <div className={styles.digitalHeader}>
            <span 
              className={`${styles.digitalNum} ${activeMode === 'hours' ? styles.activeText : ''}`}
              onClick={() => setActiveMode('hours')}
              title="Chỉnh giờ"
            >
              {String(hours).padStart(2, '0')}
            </span>
            <span className={styles.digitalSeparator}>:</span>
            <span 
              className={`${styles.digitalNum} ${activeMode === 'minutes' ? styles.activeText : ''}`}
              onClick={() => setActiveMode('minutes')}
              title="Chỉnh phút"
            >
              {String(minutes).padStart(2, '0')}
            </span>
            <div className={styles.ampmToggleInHeader}>
              <span 
                className={`${styles.ampmHeaderBtn} ${!isPM ? styles.ampmHeaderBtnActive : ''}`}
                onClick={() => toggleAMPM(false)}
              >
                AM
              </span>
              <span 
                className={`${styles.ampmHeaderBtn} ${isPM ? styles.ampmHeaderBtnActive : ''}`}
                onClick={() => toggleAMPM(true)}
              >
                PM
              </span>
            </div>
          </div>

          {/* Clock Dial */}
          <div className={styles.clockDialWrapper}>
            <div 
              className={styles.clockDial}
              ref={dialRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Center Dot */}
              <div className={styles.centerDot} />

              {/* Hand */}
              <div 
                className={`${styles.clockHand} ${isDragging ? styles.dragging : ''}`}
                style={{ transform: `rotate(${getHandRotation()}deg)` }}
              >
                <div className={styles.handLine} />
                <div className={styles.handPointer} />
              </div>

              {/* Numbers */}
              {activeMode === 'hours' ? (
                hourNumbers.map((num, idx) => {
                  const isActive = hours === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      className={`${styles.dialNumber} ${isActive ? styles.activeNumber : ''}`}
                      style={getPosition(idx)}
                      onClick={() => handleNumberClick(num)}
                    >
                      {num}
                    </button>
                  );
                })
              ) : (
                minuteNumbers.map((num, idx) => {
                  const isActive = minutes === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      className={`${styles.dialNumber} ${isActive ? styles.activeNumber : ''}`}
                      style={getPosition(idx)}
                      onClick={() => handleNumberClick(num)}
                    >
                      {String(num).padStart(2, '0')}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Precise Adjustments Panel */}
          <div className={styles.adjustmentPanel}>
            <button 
              type="button" 
              className={styles.adjustBtn} 
              onClick={() => adjustValue(-1)}
              title={activeMode === 'hours' ? "Giảm 1 giờ" : "Giảm 1 phút"}
            >
              <i className="bi bi-dash" />
            </button>
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className={`btn btn-sm px-2 py-1 rounded-pill ${activeMode === 'hours' ? 'fw-bold text-white' : 'text-secondary'}`}
                style={{ fontSize: '11px', background: activeMode === 'hours' ? '#f27125' : '#f3f4f6', border: 'none' }}
                onClick={() => setActiveMode('hours')}
              >
                Chỉnh giờ
              </button>
              <button
                type="button"
                className={`btn btn-sm px-2 py-1 rounded-pill ${activeMode === 'minutes' ? 'fw-bold text-white' : 'text-secondary'}`}
                style={{ fontSize: '11px', background: activeMode === 'minutes' ? '#f27125' : '#f3f4f6', border: 'none' }}
                onClick={() => setActiveMode('minutes')}
              >
                Chỉnh phút
              </button>
            </div>
            <button 
              type="button" 
              className={styles.adjustBtn} 
              onClick={() => adjustValue(1)}
              title={activeMode === 'hours' ? "Tăng 1 giờ" : "Tăng 1 phút"}
            >
              <i className="bi bi-plus" />
            </button>
          </div>

          {/* Close/OK button */}
          <div className={styles.footerPanel}>
            <button 
              type="button" 
              className={styles.confirmBtn}
              onClick={() => setIsOpen(false)}
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
