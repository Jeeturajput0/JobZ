"use client";

import { useEffect, useState } from "react";
import { Plus, Sparkles } from "lucide-react";

type Category = { id: string; name: string; count: number };

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load categories.");
      setCategories(result.categories || []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load categories."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function addCategory(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not add category.");
      setCategories((items) => [...items, result.category].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add category."); }
    finally { setBusy(false); }
  }
  async function removeCategory(category: Category) {
    setError(""); setBusy(true);
    try {
      const response = await fetch(`/api/categories?id=${encodeURIComponent(category.id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not remove category.");
      setCategories((items) => items.filter((item) => item.id !== category.id));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove category."); }
    finally { setBusy(false); }
  }
  return <div className="panel category-admin"><div className="panel-head"><div><b>Job categories</b><small>{categories.length} active categories</small></div></div><form className="add-category" onSubmit={addCategory}><input className="input" value={name} onChange={(event)=>setName(event.target.value)} required minLength={2} maxLength={80} placeholder="Category name"/><button className="btn btn-primary" type="submit" disabled={busy}><Plus size={16}/> Add category</button></form>{error && <p className="admin-jobs-error" role="alert">{error}</p>}{loading ? <p role="status">Loading categories…</p> : categories.length ? categories.map((category)=><div className="category-row" key={category.id}><span><Sparkles size={16}/></span><b>{category.name}</b><small>{category.count} active jobs</small><button disabled={busy} onClick={()=>void removeCategory(category)}>Remove</button></div>) : <div className="empty-state">No categories yet. Add a category to make it available for job posts.</div>}</div>;
}
