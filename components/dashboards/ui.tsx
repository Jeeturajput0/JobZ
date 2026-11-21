"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

function cell(row: unknown, key: string): ReactNode {
  if (!row || typeof row !== "object") return "";
  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.slice(0, 4).join(", ");
  if (typeof value === "object") return JSON.stringify(value).slice(0, 90);
  return String(value);
}

export function StatusPill({ value }: { value?: unknown }) {
  const status = String(value || "—");
  const tone = /verified|approved|active|accepted|hired|completed|ready|shortlisted/i.test(status)
    ? "bg-[#E7F5EE] text-[#267653]"
    : /pending|review|progress|scheduled|submitted|assigned|sourcing/i.test(status)
      ? "bg-[#FFF4DC] text-[#9A6B12]"
      : /reject|declined|suspend|closed|inactive|cancelled/i.test(status)
        ? "bg-[#FDEDE9] text-[#B25238]"
        : "bg-[#EEF1F5] text-[#52627A]";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full max-w-[220px]">
      <div className="mb-1 flex justify-between text-xs text-[#71817A]">
        <span>Profile completion</span>
        <span className="font-semibold text-[#267653]">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E9EFEC]">
        <div className="h-full rounded-full bg-[#3FA47B] transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

interface ResourcePanelProps<T> {
  title: string;
  description?: string;
  endpoint: string;
  dataKey: string;
  columns: Column<T>[];
  empty?: string;
  refreshKey?: number;
  extra?: ReactNode;
}

export function ResourcePanel<T>({ title, description, endpoint, dataKey, columns, empty, refreshKey, extra }: ResourcePanelProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}&limit=10`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to load data.");
      setRows(Array.isArray(result[dataKey]) ? result[dataKey] : []);
      setTotal(Number(result.total) || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, dataKey, page, nonce]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  return (
    <section className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172B25]">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-[#71817A]">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {extra}
          <button onClick={() => setNonce((n) => n + 1)} className="rounded-lg border border-[#E5ECE8] px-3 py-1.5 text-sm text-[#267653] hover:bg-[#F1F8F4]">Refresh</button>
        </div>
      </div>
      {error && <div className="mb-3 rounded-lg bg-[#FDEDE9] px-4 py-3 text-sm text-[#B25238]">{error}</div>}
      {loading ? (
        <div className="py-10 text-center text-sm text-[#71817A]">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#D9E3DE] bg-[#FBFDFC] py-10 text-center text-sm text-[#71817A]">
          {empty || "No records available yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E9EFEC] text-xs uppercase tracking-wide text-[#8A98A5]">
                {columns.map((c) => <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#F1F4F6] hover:bg-[#FAFCFB]">
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 align-top text-[#34455D]">
                      {c.render ? c.render(row) : cell(row, c.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 10 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-[#E5ECE8] px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span className="text-[#71817A]">Page {page} of {Math.ceil(total / 10)}</span>
          <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[#E5ECE8] px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}
    </section>
  );
}

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "date";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

interface GenericFormProps {
  title: string;
  description?: string;
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH";
  fields: FormField[];
  submitLabel?: string;
  onSuccess?: (result: Record<string, unknown>) => void;
}

export function GenericForm({ title, description, endpoint, method = "POST", fields, submitLabel, onSuccess }: GenericFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue || ""])),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) {
        setIsError(true);
        setMessage(result.message || "Request failed.");
        return;
      }
      setMessage(result.message || "Saved successfully.");
      onSuccess?.(result);
    } catch {
      setIsError(true);
      setMessage("Could not connect to JobZ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#172B25]">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-[#71817A]">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <span className="mb-1 block text-sm font-medium text-[#34455D]">{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                value={values[field.name]}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                required={field.required}
                placeholder={field.placeholder}
                rows={3}
                className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-sm outline-none focus:border-[#3FA47B] focus:ring-2 focus:ring-[#3FA47B]/20"
              />
            ) : field.type === "select" ? (
              <select
                value={values[field.name]}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                required={field.required}
                className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm outline-none focus:border-[#3FA47B]"
              >
                <option value="">Select…</option>
                {(field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                value={values[field.name]}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-sm outline-none focus:border-[#3FA47B] focus:ring-2 focus:ring-[#3FA47B]/20"
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button disabled={busy} className="rounded-lg bg-[#3FA47B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#328A66] disabled:opacity-50">
          {busy ? "Saving…" : submitLabel || "Save"}
        </button>
        {message && <span className={`text-sm ${isError ? "text-[#B25238]" : "text-[#267653]"}`}>{message}</span>}
      </div>
    </form>
  );
}
