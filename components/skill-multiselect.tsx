"use client";

import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";

export type SkillOption = { _id: string; name: string; category?: string };

type Props = {
  label: string;
  value: SkillOption[];
  onChange: (skills: SkillOption[]) => void;
  maxSelections?: number;
};

const MAX_SKILLS = 20;

export function SkillMultiSelect({ label, value, onChange, maxSelections = MAX_SKILLS }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/skills/search?q=${encodeURIComponent(query.trim())}`, { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not load skills.");
        setResults(result.skills || []);
        setActiveIndex(0);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load skills.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 180 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query]);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const selectedIds = useMemo(() => new Set(value.map((skill) => skill._id)), [value]);
  const options = results.filter((skill) => !selectedIds.has(skill._id));
  const normalizedQuery = query.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  const exactMatch = results.some((skill) => skill.name.toLocaleLowerCase("en-US") === normalizedQuery);
  const canAddCustom = Boolean(normalizedQuery) && !exactMatch && value.length < maxSelections;
  const activeCount = options.length + (canAddCustom ? 1 : 0);

  function addSkill(skill: SkillOption) {
    if (value.length >= maxSelections || selectedIds.has(skill._id)) return;
    onChange([...value, skill]);
    setQuery("");
    setOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function addCustomSkill() {
    if (!normalizedQuery || creating || value.length >= maxSelections) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not add this skill.");
      addSkill(result.skill as SkillOption);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add this skill.");
    } finally {
      setCreating(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "ArrowDown" && activeCount) {
      event.preventDefault(); setOpen(true); setActiveIndex((current) => (current + 1) % activeCount); return;
    }
    if (event.key === "ArrowUp" && activeCount) {
      event.preventDefault(); setOpen(true); setActiveIndex((current) => (current - 1 + activeCount) % activeCount); return;
    }
    if (event.key === "Enter" && open) {
      const option = options[activeIndex];
      if (option) { event.preventDefault(); addSkill(option); }
      else if (canAddCustom && activeIndex === options.length) { event.preventDefault(); void addCustomSkill(); }
    }
    if (event.key === "Backspace" && !query && value.length) onChange(value.slice(0, -1));
  }

  return (
    <div className="skill-picker [position:relative] [display:grid] [gap:7px] [min-width:0]" ref={rootRef}>
      <label className="skill-picker-label [color:#42536a] [font-size:14px] [font-weight:600]" htmlFor={id}>{label}</label>
      <div className="skill-picker-control [display:flex] [align-items:center] [gap:8px] [min-height:46px] [padding:7px_10px] [border:1px_solid_#E5ECE8] [border-radius:.5rem] [background:#fff] [&_:focus-within]:[border-color:#3FA47B] [&_:focus-within]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)] [&_:focus-within]:[outline-color:#3FA47B]" onClick={() => setOpen(true)}>
        <div className="skill-tags [display:flex] [flex:1] [flex-wrap:wrap] [align-items:center] [gap:6px] [min-width:0] [&_input]:[flex:1_1_150px] [&_input]:[min-width:100px] [&_input]:[height:30px] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[color:#172B25] [&_input]:[font:inherit] [&_input:disabled]:[flex-basis:100%] [&_input:disabled]:[min-width:0]">
          {value.map((skill) => <span className="skill-tag [display:inline-flex] [align-items:center] [gap:5px] [max-width:100%] [padding:5px_8px] [border:1px_solid_#dfe5fb] [border-radius:999px] [background:#EAF5F0] [color:#267653] [font-size:12px] [line-height:1.3] [&_button]:[display:grid] [&_button]:[flex:0_0_auto] [&_button]:[place-items:center] [&_button]:[padding:0] [&_button]:[border:0] [&_button]:[background:transparent] [&_button]:[color:inherit] [border-color:#c9e3d7]" key={skill._id}>{skill.name}<button type="button" aria-label={`Remove ${skill.name}`} onClick={(event) => { event.stopPropagation(); onChange(value.filter((item) => item._id !== skill._id)); }} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FA47B]"><X size={14} /></button></span>)}
          <input ref={inputRef} id={id} role="combobox" aria-autocomplete="list" aria-controls={`${id}-list`} aria-expanded={open} aria-activedescendant={open && activeCount ? `${id}-option-${activeIndex}` : undefined} value={query} disabled={value.length >= maxSelections} placeholder={value.length >= maxSelections ? `Maximum ${maxSelections} skills selected` : "Search skills…"} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={onKeyDown}  className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] placeholder:text-[#71817A] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20"/>
        </div>
        <small className="skill-count [flex:0_0_auto] [color:#71817A] [font-size:11px]">{value.length}/{maxSelections}</small>
      </div>
      {open && <div className="skill-suggestions [position:absolute] [z-index:25] [top:calc(100%_+_5px)] [right:0] [left:0] [max-height:250px] [overflow-y:auto] [padding:5px] [border:1px_solid_#E5ECE8] [border-radius:.5rem] [background:#fff] [box-shadow:0_14px_35px_rgb(20_43_77_/_14%)]" id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`}>
        {loading ? <div className="skill-suggestion-message [color:#71817A] [font-size:13px] [padding:11px]" role="status">Searching skills…</div> : error ? <div className="skill-suggestion-error [padding:11px] [color:#b5474e] [font-size:13px]" role="alert">{error}</div> : <>
          {options.map((skill, index) => <button type="button" role="option" aria-selected={activeIndex === index} id={`${id}-option-${index}`} className="skill-suggestion [display:flex] [width:100%] [align-items:center] [justify-content:space-between] [gap:12px] [padding:9px_10px] [border:0] [border-radius:6px] [background:transparent] [color:#172B25] [text-align:left] [cursor:pointer] [&_:hover]:[background:#f3f5fd] [&_[aria-selected='true']]:[background:#f3f5fd] [&>_span]:[display:grid] [&>_span]:[gap:2px] [&_b]:[display:inline-flex] [&_b]:[align-items:center] [&_b]:[gap:5px] [&_b]:[font-size:13px] [&_b]:[font-weight:600] [&_small]:[color:#71817A] [&_small]:[font-size:11px]" key={skill._id} onMouseEnter={() => setActiveIndex(index)} onClick={() => addSkill(skill)}><span><b>{skill.name}</b><small>{skill.category || "General"}</small></span><Check size={15} /></button>)}
          {!options.length && !canAddCustom && <div className="skill-suggestion-message [color:#71817A] [font-size:13px] [padding:11px]">{query ? "No matching skills found." : "No skills available yet."}</div>}
          {canAddCustom && <button type="button" role="option" aria-selected={activeIndex === options.length} id={`${id}-option-${options.length}`} className="skill-suggestion [display:flex] [width:100%] [align-items:center] [justify-content:space-between] [gap:12px] [padding:9px_10px] [border:0] [border-radius:6px] [background:transparent] [color:#172B25] [text-align:left] [cursor:pointer] [&_:hover]:[background:#f3f5fd] [&_[aria-selected='true']]:[background:#f3f5fd] [&>_span]:[display:grid] [&>_span]:[gap:2px] [&_b]:[display:inline-flex] [&_b]:[align-items:center] [&_b]:[gap:5px] [&_b]:[font-size:13px] [&_b]:[font-weight:600] [&_small]:[color:#71817A] [&_small]:[font-size:11px] skill-add-option" onMouseEnter={() => setActiveIndex(options.length)} onClick={() => void addCustomSkill()} disabled={creating}><span><b><Plus size={14} /> Add “{query.trim()}”</b><small>Add this skill to the shared skills list</small></span>{creating && <small>Adding…</small>}</button>}
        </>}
      </div>}
      {error && !open && <p className="skill-picker-error [color:#b5474e] [margin:0] [font-size:12px]" role="alert">{error}</p>}
    </div>
  );
}
