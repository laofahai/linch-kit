import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from '@/components/auth/session-provider'
import { TRPCProvider } from '@/components/providers/trpc-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageLoadingProvider, PerformanceMonitor } from '@/components/performance/PageLoadingProvider'
import { MonitoringProvider } from '@/components/monitoring/MonitoringProvider'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinchKit Starter - AI-First 全栈开发框架",
  description: "基于 LinchKit 框架构建的生产就绪的企业级应用模板，集成了完整的 AI-First 全栈开发能力。",
  keywords: ["LinchKit", "AI-First", "全栈开发", "企业级应用", "Next.js", "React", "TypeScript"],
  authors: [{ name: "LinchKit Team" }],
  creator: "LinchKit Framework",
  publisher: "LinchKit",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    title: "LinchKit Starter",
    description: "AI-First 全栈开发框架 - 企业级生产应用",
    type: "website",
    locale: "zh_CN",
    siteName: "LinchKit",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinchKit Starter",
    description: "AI-First 全栈开发框架 - 企业级生产应用",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <PageLoadingProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TRPCProvider>
                <AuthSessionProvider session={null}>
                  {children}
                  <PerformanceMonitor />
                  <MonitoringProvider />
                </AuthSessionProvider>
              </TRPCProvider>
            </ThemeProvider>
          </PageLoadingProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
