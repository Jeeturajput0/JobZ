"use client";

import { useEffect, useState } from "react";

type Row = Record<string, unknown>;

export function DocumentUploader({ onDone }: { onDone?: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("resume");
  const [category, setCategory] = useState("profile");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file."));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/candidate/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || file.name, type, category, dataUrl, size: file.size }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upload failed.");
      setMessage("Document uploaded securely.");
      setName("");
      setFile(null);
      onDone?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#172B25]">Upload a private document</h2>
      <p className="mt-0.5 text-sm text-[#71817A]">PDF, Word, PNG or JPG up to 5 MB. Stored privately and shared only through authorised APIs.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-sm">
          <option value="resume">Resume</option>
          <option value="coverLetter">Cover letter</option>
          <option value="educationCertificate">Education certificate</option>
          <option value="employmentProof">Employment proof</option>
          <option value="certification">Certification</option>
          <option value="portfolio">Portfolio</option>
          <option value="identity">Identity document</option>
          <option value="other">Other</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-sm">
          <option value="profile">Profile</option>
          <option value="education">Education</option>
          <option value="employment">Employment</option>
          <option value="skills">Skills</option>
        </select>
        <input type="file" accept=".pdf,.doc,.docx,image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-sm" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button disabled={busy || !file} className="rounded-lg bg-[#3FA47B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Uploading…" : "Upload"}</button>
        {message && <span className="text-sm text-[#267653]">{message}</span>}
      </div>
    </form>
  );
}

export function VerificationSubmitter({ onDone }: { onDone?: () => void }) {
  const [documents, setDocuments] = useState<Row[]>([]);
  const [category, setCategory] = useState("education");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/candidate/documents", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setDocuments(Array.isArray(d.documents) ? d.documents : []))
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const response = await fetch("/api/candidate/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, documents: selected }),
    });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Submitted for review." : "Unable to submit."));
    if (response.ok) onDone?.();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#172B25]">Request verification</h2>
      <p className="mt-0.5 text-sm text-[#71817A]">Uploading documents alone does not verify your profile — a reviewer must approve them.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-sm">
          <option value="profile">Profile</option>
          <option value="education">Education</option>
          <option value="employment">Employment</option>
          <option value="skills">Skills / certifications</option>
        </select>
        <div className="rounded-lg border border-[#E5ECE8] p-2 text-sm">
          {documents.length === 0 ? "Upload a document first." : documents.map((doc) => (
            <label key={String(doc._id)} className="flex items-center gap-2 py-1">
              <input type="checkbox" checked={selected.includes(String(doc._id))} onChange={(e) => setSelected((s) => e.target.checked ? [...s, String(doc._id)] : s.filter((id) => id !== String(doc._id)))} />
              {String(doc.name)} <span className="text-[#8A98A5]">({String(doc.type)})</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="rounded-lg bg-[#3FA47B] px-4 py-2 text-sm font-semibold text-white">Submit for review</button>
        {message && <span className="text-sm text-[#267653]">{message}</span>}
      </div>
    </form>
  );
}

export function AssessmentTaker({ assessmentId, onDone }: { assessmentId: string; onDone?: () => void }) {
  const [assessment, setAssessment] = useState<Row | null>(null);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Row | null>(null);

  useEffect(() => {
    fetch(`/api/candidate/assessments/${assessmentId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAssessment(d.assessment || null))
      .catch(() => setMessage("Unable to load assessment."));
  }, [assessmentId]);

  async function submit() {
    const payload = Object.entries(answers).map(([index, keys]) => ({ questionIndex: Number(index), selectedKeys: keys }));
    const response = await fetch(`/api/candidate/assessments/${assessmentId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    });
    const data = await response.json();
    if (response.ok) {
      setResult(data.attempt);
      onDone?.();
    } else {
      setMessage(data.message || "Unable to submit attempt.");
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#172B25]">Result: {String(result.percentage)}%</h2>
        <p className="mt-2 text-sm text-[#71817A]">Strengths: {(result.strengths as string[] || []).join(", ") || "None identified yet."}</p>
        <p className="mt-1 text-sm text-[#71817A]">Areas to improve: {(result.improvements as string[] || []).join(", ") || "None."}</p>
      </div>
    );
  }

  const questions = (assessment?.questions as Row[] | undefined) || [];
  return (
    <div className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#172B25]">{String(assessment?.title || "Assessment")}</h2>
      {questions.map((q, index) => (
        <div key={index} className="mt-4 border-t border-[#EEF2F0] pt-4">
          <p className="text-sm font-medium text-[#34455D]">{index + 1}. {String(q.prompt)}</p>
          <div className="mt-2 space-y-1">
            {String(q.type) === "single" ? (
              (q.options as Row[] || []).map((option) => (
                <label key={String(option.key)} className="flex items-center gap-2 text-sm text-[#52627A]">
                  <input type="radio" name={`q-${index}`} checked={(answers[index] || [])[0] === String(option.key)} onChange={() => setAnswers((a) => ({ ...a, [index]: [String(option.key)] }))} />
                  {String(option.text)}
                </label>
              ))
            ) : String(q.type) === "multiple" ? (
              (q.options as Row[] || []).map((option) => (
                <label key={String(option.key)} className="flex items-center gap-2 text-sm text-[#52627A]">
                  <input type="checkbox" checked={(answers[index] || []).includes(String(option.key))} onChange={(e) => setAnswers((a) => {
                    const current = a[index] || [];
                    return { ...a, [index]: e.target.checked ? [...current, String(option.key)] : current.filter((k) => k !== String(option.key)) };
                  })} />
                  {String(option.text)}
                </label>
              ))
            ) : (
              <textarea onChange={(e) => setAnswers((a) => ({ ...a, [index]: [] }))} placeholder="Written answers require human review" className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-sm" />
            )}
          </div>
        </div>
      ))}
      <div className="mt-5 flex items-center gap-3">
        <button disabled={!questions.length} onClick={submit} className="rounded-lg bg-[#3FA47B] px-4 py-2 text-sm font-semibold text-white">Submit assessment</button>
        {message && <span className="text-sm text-[#B25238]">{message}</span>}
      </div>
    </div>
  );
}
