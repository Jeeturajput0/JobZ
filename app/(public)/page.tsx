import type { Metadata } from "next";
import { HomePage } from '@/components/site';
export const metadata: Metadata = {
  title: "Find work that fits",
  description: "Explore current job openings, company profiles, and career opportunities with JobZ.",
  alternates: { canonical: "/" },
};
export default function Page(){return <HomePage/>;}
