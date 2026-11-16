"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Footer, Navbar } from "@/components/site";
import { AnimatedHeading } from "@/components/animations/AnimatedHeading";

export function ContactPage() {
  const [busy,setBusy]=useState(false); const [notice,setNotice]=useState(""); const [error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setNotice("");setError("");const form=new FormData(event.currentTarget);try{const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),email:form.get("email"),topic:form.get("topic"),message:form.get("message")})});const result=await response.json();if(!response.ok)throw new Error(result.message||"Could not send your message.");setNotice("Your message has been received.");event.currentTarget.reset()}catch(reason){setError(reason instanceof Error?reason.message:"Could not send your message.")}finally{setBusy(false)}}
  return <><Navbar/><main className="contact-page"><div className="contact-intro"><div className="kicker">CONTACT JOBZ</div><AnimatedHeading as="h1">How can we<br/><span className="serif-accent">help you?</span></AnimatedHeading><p>Send a message to the JobZ team. Your message and contact details will be saved in the admin workspace.</p><div className="contact-detail"><span><Mail size={18}/></span><div><b>Contact form</b><small>All fields are required.</small></div></div></div><form className="contact-form" onSubmit={submit}><AnimatedHeading as="h2">Send a message</AnimatedHeading><p>All fields are required.</p><label>Your name<input required name="name" minLength={2} maxLength={100} className="input" autoComplete="name"/></label><label>Email address<input required name="email" type="email" maxLength={254} className="input" autoComplete="email"/></label><label>Topic<input required name="topic" minLength={2} maxLength={80} className="input"/></label><label>Message<textarea name="message" className="input" required minLength={2} maxLength={5000} rows={5}/></label>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}<button className="btn btn-primary btn-wide" disabled={busy}>{busy?"Sending…":"Send message"}<ArrowRight size={16}/></button></form></main><Footer/></>;
}
