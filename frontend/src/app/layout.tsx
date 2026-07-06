import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import "./globals.css";
import "../styles/style.css";
import "../styles/sidebar.css";
import GlobalBookingCall from "@/components/common/GlobalBookingCall";

export const metadata: Metadata = {
  title: "PolyHUB - FPT Polytechnic",
  description: "Mạng xã hội học tập dành riêng cho sinh viên FPT Polytechnic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Đã thêm suppressHydrationWarning vào đây để chặn lỗi do Extension con trỏ chuột gây ra
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          crossOrigin="anonymous"
        />
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" 
          crossOrigin="anonymous"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
            <GlobalBookingCall />
          </ToastProvider>
        </AuthProvider>
        <Script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}