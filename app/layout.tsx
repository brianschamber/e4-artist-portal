import "./globals.css";
import type { ReactNode } from "react";
import E4SessionProvider from "./SessionProvider";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "E4 Artist Portal",
  description: "E4 Entertainment tools for artists",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <E4SessionProvider>
          <div
            style={{
              display: "flex",
              minHeight: "100vh",
              background: "var(--background)",
              color: "var(--text-primary)",
            }}
          >
            {/* LEFT SIDEBAR */}
            <Sidebar />

            {/* MAIN CONTENT AREA */}
            <main
              style={{
                flex: 1,
                padding: "32px 48px",
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <div style={{ width: "100%", maxWidth: "1200px" }}>
                {children}
              </div>
            </main>
          </div>
        </E4SessionProvider>
      </body>
    </html>
  );
}
