"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

type Person = { _id: string; fullName: string; email: string; status: string; createdAt: string };
export function AdminPeoplePanel({ role }: { role: "jobSeeker" | "employer" }) {
  const [users,setUsers]=useState<Person[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(()=>{let active=true;fetch(`/api/admin/users?role=${role}`,{cache:"no-store"}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.message||"Could not load users.");if(active)setUsers(x.users||[])}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Could not load users.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[role]);
  const label=role==="jobSeeker"?"Job seekers":"Employers";
  return <div className="panel table-panel"><div className="panel-head"><div><b>{label}</b><small>Account records from MongoDB</small></div></div>{loading?<p role="status">Loading {label.toLowerCase()}…</p>:error?<p role="alert">{error}</p>:users.length?<div className="scroll-table"><div className="data-row data-head"><span>Name</span><span>Email</span><span>Joined</span><span>Status</span></div>{users.map(user=><div className="data-row" key={user._id}><span>{user.fullName}</span><span>{user.email}</span><span>{new Date(user.createdAt).toLocaleDateString()}</span><span>{user.status}</span></div>)}</div>:<div className="empty-state"><Users/><h3>No {label.toLowerCase()} registered</h3><p>Registered accounts will appear here.</p></div>}</div>;
}

type Application = { _id: string; status: string; appliedAt: string; jobId?: { title?: string } | null; jobSeekerId?: { fullName?: string; email?: string } | null };
export function AdminApplicationsPanel() {
  const [items,setItems]=useState<Application[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(()=>{let active=true;fetch("/api/admin/applications",{cache:"no-store"}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.message||"Could not load applications.");if(active)setItems(x.applications||[])}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Could not load applications.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  return <div className="panel table-panel"><div className="panel-head"><div><b>Applications</b><small>Recent application records</small></div></div>{loading?<p role="status">Loading applications…</p>:error?<p role="alert">{error}</p>:items.length?<div className="scroll-table"><div className="data-row data-head"><span>Candidate</span><span>Email</span><span>Job</span><span>Status</span><span>Applied</span></div>{items.map((item)=><div className="data-row" key={item._id}><span>{item.jobSeekerId?.fullName||"Candidate unavailable"}</span><span>{item.jobSeekerId?.email||""}</span><span>{item.jobId?.title||"Job unavailable"}</span><span>{item.status}</span><span>{new Date(item.appliedAt).toLocaleDateString()}</span></div>)}</div>:<div className="empty-state"><p>No application records yet.</p></div>}</div>;
}

type ContactMessage={_id:string;name:string;email:string;topic:string;message:string;createdAt:string};
export function AdminContactMessagesPanel(){
  const [messages,setMessages]=useState<ContactMessage[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let active=true;fetch("/api/admin/contact-messages",{cache:"no-store"}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.message||"Could not load messages.");if(active)setMessages(x.messages||[])}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Could not load messages.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  return <div className="panel table-panel"><div className="panel-head"><div><b>Contact messages</b><small>Messages submitted through the JobZ contact form</small></div></div>{loading?<p role="status">Loading contact messages…</p>:error?<p role="alert">{error}</p>:messages.length?messages.map((item)=><article className="notification-item" key={item._id}><div><b>{item.topic}</b><p>{item.message}</p><small>{item.name} · {item.email} · {new Date(item.createdAt).toLocaleString()}</small></div></article>):<div className="empty-state"><p>No contact messages yet.</p></div>}</div>;
}
