import type { Metadata } from "next";
import { AboutPage } from '@/components/portal';
export const metadata: Metadata = {
  title: "About JobZ",
  description: "Learn about JobZ's mission to make finding meaningful work simpler and more transparent.",
  alternates: { canonical: "/about" },
};
export default function Page(){return <AboutPage/>;}
