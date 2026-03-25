import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Insurance Fraud Detection Platform",
  description: "SIU Dashboard for claims investigation, fraud scoring, and reporting",
};

/**
 * Root layout wrapping all pages with a sidebar navigation and main content area.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              marginLeft: "var(--sidebar-width)",
              padding: "24px 32px",
              maxWidth: "calc(100vw - var(--sidebar-width))",
              overflow: "auto",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
