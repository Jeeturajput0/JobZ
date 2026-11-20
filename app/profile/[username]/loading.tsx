export default function ProfileLoading() {
  return <main aria-label="Loading profile" className="min-h-[calc(100vh-64px)] animate-pulse bg-[#F7F9F8] pb-16">
    <div className="h-36 bg-[#EAF5F0] sm:h-44" />
    <div className="mx-auto -mt-12 max-w-6xl px-4 sm:px-8">
      <div className="flex flex-col gap-5 rounded-2xl border border-[#E5ECE8] bg-white p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="size-20 shrink-0 rounded-full bg-[#E5ECE8] sm:size-24" />
        <div className="flex-1 space-y-3"><div className="h-3 w-32 rounded bg-[#E5ECE8]" /><div className="h-8 max-w-sm rounded bg-[#E5ECE8]" /><div className="h-4 max-w-xs rounded bg-[#EEF2EF]" /></div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(270px,3fr)]"><div className="space-y-5"><div className="h-64 rounded-2xl border border-[#E5ECE8] bg-white" /><div className="h-48 rounded-2xl border border-[#E5ECE8] bg-white" /></div><div className="h-72 rounded-2xl border border-[#E5ECE8] bg-white" /></div>
    </div>
  </main>;
}
