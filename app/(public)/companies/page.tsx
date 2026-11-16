import type { Metadata } from "next";
import { CompaniesDirectory } from '@/components/company-pages';
export const metadata: Metadata = {
  title: "Explore companies",
  description: "Browse employer profiles, industries, locations, and active roles on JobZ.",
  alternates: { canonical: "/companies" },
};
export default function Page(){return <CompaniesDirectory/>;}
