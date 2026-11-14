"use client";
import { use } from "react";
import { DashboardPage } from "@/components/portal";
export default function Page({
  params,
}: {
  params: Promise<{ role: string; section?: string[] }>;
}) {
  const p = use(params);
  return (
    <DashboardPage role={p.role} section={p.section?.[0] || "dashboard"} />
  );
}
