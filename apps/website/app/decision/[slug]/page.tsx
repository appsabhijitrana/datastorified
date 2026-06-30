import {notFound} from "next/navigation";import {Footer,Header} from "@datastorified/ui";import {decisionById,decisions} from "@datastorified/decision-engine";import {createMetadata} from "@datastorified/seo";import {DecisionFlow} from "../../../components/decision/DecisionFlow";
export const dynamicParams=false;
export function generateStaticParams(){return decisions.map(({id})=>({slug:id}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const config=decisionById(slug);return config?createMetadata(`${config.title} — Decision Engine`,config.description,"datastorified.com",`/decision/${slug}`):{}}
export default async function DecisionPage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const config=decisionById(slug);if(!config)notFound();return <><Header/><DecisionFlow config={config}/><Footer/></>}
