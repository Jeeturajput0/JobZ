import Link from "next/link";
import { ArrowLeft, UserRoundSearch } from "lucide-react";

export default function ProfileNotFound() {
  return <main className="grid min-h-[60vh] place-items-center bg-[#F7F9F8] px-5 py-16">
    <div className="max-w-md rounded-2xl border border-[#E5ECE8] bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#EAF5F0] text-[#3FA47B]"><UserRoundSearch className="size-7" /></span>
      <h1 className="mt-5 text-2xl font-bold text-[#172B25]">Profile not found</h1>
      <p className="mt-2 text-sm leading-6 text-[#71817A]">This profile may have been removed or the link may be out of date.</p>
      <Link href="/jobs" className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#3FA47B] px-4 text-sm font-semibold text-white hover:bg-[#267653]"><ArrowLeft className="size-4" />Explore jobs</Link>
    </div>
  </main>;
}
