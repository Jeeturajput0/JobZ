import { CompanyDetails } from '@/components/company-pages';
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <CompanyDetails id={slug}/>;}
