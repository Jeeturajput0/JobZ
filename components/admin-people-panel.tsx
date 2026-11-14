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
