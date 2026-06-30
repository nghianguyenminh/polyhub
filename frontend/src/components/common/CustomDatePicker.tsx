'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import styles from './CustomDatePicker.module.css';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  error?: boolean;
}

const MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  id,
  error = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Calendar navigation state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Set initial view state based on value
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // 0-indexed
        if (!isNaN(y) && !isNaN(m)) {
          setCurrentYear(y);
          setCurrentMonth(m);
        }
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format YYYY-MM-DD to DD/MM/YYYY for display
  const getDisplayValue = () => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  };

  // Generate Year options (from 1940 to current year + 5)
  const years: number[] = [];
  const endYear = today.getFullYear() + 2;
  for (let y = endYear; y >= 1940; y--) {
    years.push(y);
  }

  // Prev / Next Month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build Day grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  // Day index of 1st day (0 for Mon, 6 for Sun)
  const firstDayIndex = (() => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    return day === 0 ? 6 : day - 1;
  })();

  const cells: { day: number; monthOffset: number; isSelected: boolean; isToday: boolean }[] = [];

  // 1. Prev month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: prevDaysInMonth - i,
      monthOffset: -1,
      isSelected: false,
      isToday: false,
    });
  }

  // 2. Current month days
  const [valY, valM, valD] = value ? value.split('-').map((n) => parseInt(n, 10)) : [0, 0, 0];

  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = valY === currentYear && valM === currentMonth + 1 && valD === d;
    const isTodayDay =
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === d;

    cells.push({
      day: d,
      monthOffset: 0,
      isSelected,
      isToday: isTodayDay,
    });
  }

  // 3. Next month leading days (fill up to multiple of 7, max 42 cells)
  const remainingCells = 42 - cells.length;
  for (let d = 1; d <= remainingCells; d++) {
    cells.push({
      day: d,
      monthOffset: 1,
      isSelected: false,
      isToday: false,
    });
  }

  // Day Selection
  const handleSelectDay = (day: number, offset: number) => {
    let targetMonth = currentMonth + offset;
    let targetYear = currentYear;

    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    } else if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }

    const yStr = String(targetYear);
    const mStr = String(targetMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');

    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const yStr = String(today.getFullYear());
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const dStr = String(today.getDate()).padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={styles.pickerWrapper} ref={wrapperRef}>
      {/* Input Selector Button */}
      <div
        id={id}
        className={`${styles.inputField} ${error ? styles.error : ''} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <span className={styles.dateText}>{getDisplayValue()}</span>
        ) : (
          <span className={styles.placeholderText}>{placeholder}</span>
        )}
        <div className={styles.iconWrapper}>
          <Calendar size={18} />
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className={styles.dropdownContainer}>
          {/* Header Controls */}
          <div className={styles.header}>
            <button type="button" className={styles.navButton} onClick={handlePrevMonth}>
              ❮
            </button>
            <div className={styles.selectGroup}>
              {/* Month Dropdown */}
              <select
                className={styles.monthSelect}
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
              >
                {MONTHS.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                className={styles.yearSelect}
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className={styles.navButton} onClick={handleNextMonth}>
              ❯
            </button>
          </div>

          {/* Weekday Titles */}
          <div className={styles.weekdays}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <div key={idx} className={styles.weekdayLabel}>
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={styles.daysGrid}>
            {cells.map((cell, idx) => (
              <div
                key={idx}
                className={`${styles.dayCell} ${
                  cell.monthOffset !== 0 ? styles.otherMonth : ''
                } ${cell.isSelected ? styles.selected : ''} ${
                  cell.isToday ? styles.today : ''
                }`}
                onClick={() => handleSelectDay(cell.day, cell.monthOffset)}
              >
                {cell.day}
              </div>
            ))}
          </div>

          {/* Footer controls */}
          <div className={styles.footer}>
            <button type="button" className={`${styles.footerButton} ${styles.clearBtn}`} onClick={handleClear}>
              Xóa
            </button>
            <button type="button" className={`${styles.footerButton} ${styles.todayBtn}`} onClick={handleSelectToday}>
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
