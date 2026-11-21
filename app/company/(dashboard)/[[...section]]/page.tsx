"use client";
import { use } from "react";
import { CompanySection } from "@/components/company/sections";

export default function Page({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section = [] } = use(params);
  return <CompanySection path={section} />;
}
