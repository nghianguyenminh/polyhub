export const theme = {
  colors: {
    // Primary Brand Colors
    primary: '#F27125', // Cam FPT
    primarySoft: 'rgba(242, 113, 37, 0.08)',
    primaryActive: 'rgba(242, 113, 37, 0.15)',
    primaryGradientStart: '#F27125',
    primaryGradientEnd: '#FFC371',

    // Backgrounds
    background: '#F0F2F5', // Nền ứng dụng chính (Xám nhạt)
    card: '#FFFFFF',       // Nền cho các thẻ (Trắng)

    // Text Colors
    textMain: '#050505',   // Đen sắc nét
    textMuted: '#65676B',  // Xám chữ phụ
    textLight: '#9CA3AF',  // Xám nhạt

    // Status / Utility Colors
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    border: 'rgba(0, 0, 0, 0.05)',
    divider: '#CED0D4',
    iconBackground: '#E4E6EB',
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    sizes: {
      h1: 24,
      h2: 20,
      h3: 18,
      body: 16,
      caption: 14,
      small: 12,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16, // Main card border radius from web
    pill: 9999, // 50rem equivalent
  },
  shadows: {
    // Soft shadow matching web's 0 2px 12px rgba(0, 0, 0, 0.03)
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2, // For Android
    },
    // Stronger shadow for modals/dropdowns
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 5,
    },
    // Primary colored shadow for main buttons
    primaryGlow: {
      shadowColor: '#F27125',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    }
  }
};
