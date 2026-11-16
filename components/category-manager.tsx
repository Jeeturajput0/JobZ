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
  return <div className="panel [background:#fff] [border:1px_solid_#eaedf1] [border-radius:.75rem] [border-color:#E5ECE8] [box-shadow:0_1px_2px_rgb(24_45_77_/_3%)] category-admin [padding:20px] [max-width:760px]"><div className="panel-head [&_select]:[width:112px] [&_select]:[padding:7px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [display:flex] [justify-content:space-between] [align-items:center] [&>div]:[display:grid] [&>div]:[gap:5px] [&_b]:[font-size:21px] [&_b]:[color:#354761] [&_small]:[font-size:14px] [&_small]:[color:#929daa] [.table-panel>_&]:[margin-bottom:17px] [&_b]:[line-height:1.35] [&_small]:[line-height:1.5]"><div><b>Job categories</b><small>{categories.length} active categories</small></div></div><form className="add-category [display:flex] [gap:9px] [margin:17px_0] max-[700px]:[flex-wrap:wrap]" onSubmit={addCategory}><input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" value={name} onChange={(event)=>setName(event.target.value)} required minLength={2} maxLength={80} placeholder="Category name"/><button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)]" type="submit" disabled={busy}><Plus size={16}/> Add category</button></form>{error && <p className="admin-jobs-error [color:#a34149!important] [background:#fff4f4] [padding:10px_12px] [border-radius:7px] [font-size:12px]" role="alert">{error}</p>}{loading ? <p role="status" className="text-sm leading-6 text-[#71817A]">Loading categories…</p> : categories.length ? categories.map((category)=><div className="category-row [&_button]:[background:none] [&_button]:[border:0] [&_button]:[color:#328A66] [&_button]:[font-size:15px] [display:flex] [align-items:center] [gap:12px] [border-top:1px_solid_#eff1f4] [padding:14px_4px] [font-size:14px] [&>span]:[display:grid] [&>span]:[place-items:center] [&>span]:[width:30px] [&>span]:[height:30px] [&>span]:[border-radius:7px] [&>span]:[background:#f1f3fc] [&>span]:[color:#6679c6] [&_b]:[flex:1] [&_small]:[color:#8995a3] max-[700px]:[gap:8px] max-[700px]:[&_small]:[display:none] [&_button]:[line-height:1.5] [line-height:1.5] [&_button:hover]:[color:#267653] [&>_span]:[background:#EAF5F0] [&>_span]:[color:#267653]" key={category.id}><span><Sparkles size={16}/></span><b>{category.name}</b><small>{category.count} active jobs</small><button disabled={busy} onClick={()=>void removeCategory(category)} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FA47B]">Remove</button></div>) : <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]">No categories yet. Add a category to make it available for job posts.</div>}</div>;
}
