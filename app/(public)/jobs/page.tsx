import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JobsPage } from '@/components/site';
export const metadata: Metadata = {
  title: 'Find jobs',
  description: 'Search current job openings by role, location, category, work style, and experience.',
  alternates: { canonical: '/jobs' },
};
export default function Page(){return <Suspense fallback={<div className="loading-screen [height:100vh] [display:grid] [place-items:center] [color:#3FA47B]">Loading opportunities…</div>}><JobsPage/></Suspense>;}
