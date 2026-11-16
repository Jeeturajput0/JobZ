import type { Metadata } from "next";
import "./globals.css";
import { JobZProvider } from "@/components/provider";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
  title: "JobZ | Find work that fits",
  description: "Discover meaningful jobs and your next opportunity with JobZ.",
  openGraph: {
    type: "website",
    siteName: "JobZ",
    title: "JobZ | Find work that fits",
    description: "Discover meaningful jobs and your next opportunity with JobZ.",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="m-0 min-h-screen bg-[#F7F9F8] font-sans text-[#172B25] antialiased [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[#3FA47B] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-[#3FA47B] [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-[#3FA47B] [&_textarea:focus-visible]:outline-2 [&_textarea:focus-visible]:outline-offset-2 [&_textarea:focus-visible]:outline-[#3FA47B] [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-offset-2 [&_select:focus-visible]:outline-[#3FA47B]">
        <JobZProvider>{children}</JobZProvider>
      </body>
    </html>
  );
}
