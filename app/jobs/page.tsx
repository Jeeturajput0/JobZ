'use client';
import { Suspense } from 'react';
import { JobsPage } from '@/components/site';
export default function Page(){return <Suspense fallback={<div className="loading-screen">Loading opportunities…</div>}><JobsPage/></Suspense>;}
