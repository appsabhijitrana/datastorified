import type {Metadata} from "next";import {Footer,Header} from "@datastorified/ui";import {DecisionResultPage} from "../../../../components/decision/DecisionResultPage";
export const metadata:Metadata={title:"Your decision result — DataStorified",description:"A locally saved DataStorified decision result.",robots:{index:false,follow:false}};
export default async function ResultPage({params}:{params:Promise<{id:string}>}){const{id}=await params;return <><Header/><DecisionResultPage id={id}/><Footer/></>}
