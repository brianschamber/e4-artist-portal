import "./globals.css";
import type { ReactNode } from "react";
import E4SessionProvider from "./SessionProvider";
import ProtectedShell from "./ProtectedShell";

export const metadata = {
  title: "E4 Artist Portal",
  description: "E4 Entertainment tools for artists",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <E4SessionProvider>
          <ProtectedShell>{children}</ProtectedShell>
        </E4SessionProvider>
      </body>
    </html>
  );
}
