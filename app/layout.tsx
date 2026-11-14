import type { Metadata } from "next";
import "./globals.css";
import { JobZProvider } from "@/components/provider";
export const metadata: Metadata = {
  title: "JobZ — Your Career. Your Future. Your JobZ.",
  description: "Discover your next opportunity with JobZ.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <JobZProvider>{children}</JobZProvider>
      </body>
    </html>
  );
}
