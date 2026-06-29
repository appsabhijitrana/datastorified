import "./globals.css";import {createMetadata} from "@datastorified/seo";
export const metadata=createMetadata("DataStorified — Decision Intelligence for Everyone","Ask real-life questions and get clear, data-backed next steps.","datastorified.com");
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
