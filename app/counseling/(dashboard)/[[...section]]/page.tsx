"use client";
import { use } from "react";
import { CounselingSection } from "@/components/counseling/sections";

export default function Page({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section = [] } = use(params);
  return <CounselingSection path={section} />;
}
