import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import {
  Cormorant_Garamond,
  Inter,
  Noto_Sans_TC,
  Noto_Serif_TC,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// 中文標題用思源宋體接在 Cormorant 後，避免 fallback 到系統預設襯線字
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-serif-tc",
  weight: ["500", "600", "700"],
  preload: false,
});

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
});

// 內文中文用思源黑體，非 Apple 裝置也能有一致的無襯線呈現
const notoSansTC = Noto_Sans_TC({
  variable: "--font-sans-tc",
  weight: ["400", "500", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Kairos - 掌握時機，掌握語言",
  description: "Open source flashcard webapp for effective learning",
  icons: {
    icon: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Kairos",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D2275",
  viewportFit: "cover", // 讓 env(safe-area-inset-*) 在 iOS 回報實際安全距離
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body
        className={`${cormorant.variable} ${notoSerifTC.variable} ${inter.variable} ${notoSansTC.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
