export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string;
  color: string;
  location: string;
  salary: string;
  type: string;
  mode: string;
  category: string;
  posted: string;
  featured?: boolean;
  description: string;
};
export const seedJobs: Job[] = [
  {
    id: "j1",
    title: "Senior Product Designer",
    company: "Linear",
    logo: "L",
    color: "#5e6ad2",
    location: "Remote · US",
    salary: "$140k – $180k",
    type: "Full-time",
    mode: "Remote",
    category: "Design",
    posted: "2 days ago",
    featured: true,
    description:
      "Shape intuitive, thoughtful experiences used by ambitious product teams around the world.",
  },
  {
    id: "j2",
    title: "Product Marketing Manager",
    company: "Notion",
    logo: "N",
    color: "#252525",
    location: "New York, NY",
    salary: "$125k – $160k",
    type: "Full-time",
    mode: "Hybrid",
    category: "Marketing",
    posted: "1 day ago",
    featured: true,
    description:
      "Tell the story of a new way of working and help teams get more from Notion.",
  },
  {
    id: "j3",
    title: "Frontend Engineer, Platform",
    company: "Vercel",
    logo: "▲",
    color: "#111827",
    location: "Remote · US",
    salary: "$150k – $210k",
    type: "Full-time",
    mode: "Remote",
    category: "Engineering",
    posted: "3 days ago",
    featured: true,
    description:
      "Build the tools and infrastructure that make the web better for everyone.",
  },
  {
    id: "j4",
    title: "People Operations Associate",
    company: "Figma",
    logo: "F",
    color: "#a259ff",
    location: "San Francisco, CA",
    salary: "$85k – $115k",
    type: "Full-time",
    mode: "On-site",
    category: "People",
    posted: "4 days ago",
    description:
      "Create a welcoming, effective employee experience as our team grows.",
  },
  {
    id: "j5",
    title: "Data Analyst",
    company: "Stripe",
    logo: "S",
    color: "#635bff",
    location: "Remote · US",
    salary: "$110k – $145k",
    type: "Full-time",
    mode: "Remote",
    category: "Data",
    posted: "5 days ago",
    description:
      "Turn complex data into insights that help millions of businesses grow.",
  },
  {
    id: "j6",
    title: "UX Research Intern",
    company: "Airbnb",
    logo: "A",
    color: "#ff5a5f",
    location: "Seattle, WA",
    salary: "$35 – $45 / hr",
    type: "Internship",
    mode: "Hybrid",
    category: "Design",
    posted: "1 week ago",
    description:
      "Help us understand how people experience belonging around the world.",
  },
  {
    id: "j7",
    title: "Customer Success Manager",
    company: "Webflow",
    logo: "W",
    color: "#146ef5",
    location: "Austin, TX",
    salary: "$95k – $125k",
    type: "Full-time",
    mode: "Hybrid",
    category: "Customer Success",
    posted: "1 week ago",
    description:
      "Partner with customers to help them build a stronger web presence.",
  },
  {
    id: "j8",
    title: "Brand Designer",
    company: "Headspace",
    logo: "H",
    color: "#f47c46",
    location: "Remote · US",
    salary: "$100k – $135k",
    type: "Contract",
    mode: "Remote",
    category: "Design",
    posted: "2 weeks ago",
    description:
      "Bring a calming, distinctive visual language to new experiences.",
  },
];
