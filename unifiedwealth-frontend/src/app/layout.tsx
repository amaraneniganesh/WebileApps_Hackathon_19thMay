import type { Metadata } from "next";
import "@/app/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastNotification } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Unified Wealth Intelligence Console",
  description: "Normalized Cross-Service Financial Intelligence Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <ToastNotification />
        </AuthProvider>
      </body>
    </html>
  );
}