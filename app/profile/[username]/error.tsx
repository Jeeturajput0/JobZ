"use client";

export default function ProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main role="alert" className="grid min-h-[60vh] place-items-center bg-[#F7F9F8] px-5 py-16">
    <div className="max-w-md rounded-2xl border border-[#E5ECE8] bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-[#172B25]">We couldn’t load this profile</h1>
      <p className="mt-2 text-sm leading-6 text-[#71817A]">Please try again in a moment.</p>
      <button type="button" onClick={reset} className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#3FA47B] px-5 text-sm font-semibold text-white hover:bg-[#267653]">Try again</button>
    </div>
  </main>;
}
