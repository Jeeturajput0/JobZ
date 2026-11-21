"use client";
import { use } from "react";
import { SuperAdminSection } from "@/components/super-admin/sections";

export default function Page({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section = [] } = use(params);
  return <SuperAdminSection path={section} />;
}
