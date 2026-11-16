"use client";

import { useEffect, useMemo, useState } from "react";
import { useJobZ } from "@/components/provider";
import type { HomeCategory, HomeCompany, HomeSkill } from "./HomeSections";
import { CTASection, CategoriesSection, FeaturedJobs, HomeHero, HowJobZWorks, TopCompanies, TrustedCompanies, WhyChooseJobZ } from "./HomeSections";

export function HomePage() {
  const { jobs, jobsLoading, jobsError } = useJobZ();
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [companies, setCompanies] = useState<HomeCompany[]>([]);
  const [skills, setSkills] = useState<HomeSkill[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/categories", { cache: "no-store" }),
      fetch("/api/companies", { cache: "no-store" }),
      fetch("/api/skills/trending", { cache: "no-store" }),
    ])
      .then(async ([categoryResponse, companyResponse, skillResponse]) => {
        const [categoryData, companyData, skillData] = await Promise.all([
          categoryResponse.json(), companyResponse.json(), skillResponse.json(),
        ]);
        if (!categoryResponse.ok || !companyResponse.ok) throw new Error("Directory data unavailable");
        if (!active) return;
        setCategories(categoryData.categories || []);
        setCompanies(companyData.companies || []);
        setSkills(skillResponse.ok ? skillData.skills || [] : []);
      })
      .catch(() => { if (active) setDirectoryError(true); })
      .finally(() => { if (active) setDirectoryLoading(false); });
    return () => { active = false; };
  }, []);

  const featuredJobs = useMemo(() => {
    const featured = jobs.filter((job) => job.featured);
    return [...featured, ...jobs.filter((job) => !job.featured)].slice(0, 3);
  }, [jobs]);

  return <main className="bg-white text-[#111827]">
    <HomeHero skills={skills} />
    <TrustedCompanies companies={companies} />
    <CategoriesSection categories={categories.slice().sort((a, b) => b.count - a.count)} />
    <FeaturedJobs jobs={featuredJobs} loading={jobsLoading} error={jobsError} />
    <HowJobZWorks />
    <TopCompanies companies={companies} loading={directoryLoading} error={directoryError} />
    <WhyChooseJobZ />
    <CTASection />
  </main>;
}
