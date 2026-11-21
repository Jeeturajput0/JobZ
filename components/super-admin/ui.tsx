"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#172B25]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#71817A]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ value }: { value?: unknown }) {
  const status = String(value ?? "—");
  const tone = /verified|approved|accepted|active|confirmed|hired|completed/i.test(status)
    ? "bg-[#E7F5EE] text-[#267653]"
    : /pending|review|sourcing|submitted|recorded|inprogress/i.test(status)
      ? "bg-[#FFF4DC] text-[#9A6B12]"
      : /reject|suspend|terminated|cancelled|inactive|declined/i.test(status)
        ? "bg-[#FDEDE9] text-[#B25238]"
        : "bg-[#EEF1F5] text-[#52627A]";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}>{status}</span>;
}

export function EmptyState({ message = "No records available yet." }: { message?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#DCE5E0] bg-[#FCFDFC] px-4 py-12 text-center text-sm text-[#71817A]">
      {message}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="mb-4 rounded-lg border border-[#F3CFC5] bg-[#FDEDE9] px-4 py-3 text-sm text-[#B25238]">{message}</div>;
}

export function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-[0_1px_2px_rgba(24,45,77,0.03)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#172B25]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#8A98A5]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#E5ECE8] bg-white p-4 shadow-[0_1px_2px_rgba(24,45,77,0.03)]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#8A98A5]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#172B25]">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-[#8A98A5]">{hint}</p>}
    </div>
  );
}

export type Column<T> = { key: string; label: string; render?: (row: T) => ReactNode };

export function DataTable<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#E9EFEC] text-[11px] uppercase tracking-wide text-[#93A09A]">
            {columns.map((c) => <th key={c.key} className="whitespace-nowrap px-3 py-2 font-medium">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#F1F4F2] hover:bg-[#FAFCFB]">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2.5 align-top text-[#34455D]">
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function useResource<T>(endpoint: string, dataKey: string, deps: unknown[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}&limit=10`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to load data.");
      setData(Array.isArray(result[dataKey]) ? result[dataKey] : []);
      setTotal(Number(result.total) || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, dataKey, page, nonce]);

  useEffect(() => { void load(); }, [load, ...deps]);

  return {
    data, total, loading, error, page, setPage,
    refresh: () => setNonce((n) => n + 1),
    reload: load,
  };
}

export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / 10));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-3 text-xs text-[#71817A]">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-[#E5ECE8] px-3 py-1.5 disabled:opacity-40">Previous</button>
      <span>Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-[#E5ECE8] px-3 py-1.5 disabled:opacity-40">Next</button>
    </div>
  );
}

/** Simple search/filter bar wired into the endpoint as query parameters. */
export function FilterBar({ search, onSearch, filters, values, onFilter }: {
  search: string;
  onSearch: (value: string) => void;
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  values?: Record<string, string>;
  onFilter?: (key: string, value: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search…"
        className="w-full max-w-xs rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#3FA47B]" />
      {(filters || []).map((f) => (
        <select key={f.key} value={values?.[f.key] || ""} onChange={(e) => onFilter?.(f.key, e.target.value)}
          className="rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#3FA47B]">
          <option value="">All {f.label}</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
    </div>
  );
}
