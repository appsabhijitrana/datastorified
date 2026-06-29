export * from "./registry";
export type ToolOutput={primary:string;meta?:Record<string,string|number>;valid?:boolean};
export function runTool(mode:string,input:string,options:Record<string,string|number|boolean>={}):ToolOutput{
 try { switch(mode){
  case "stats":{const chars=input.length,words=input.trim()?input.trim().split(/\s+/).length:0;return{primary:`${words} words`,meta:{Characters:chars,"Without spaces":input.replace(/\s/g,"").length,Lines:input?input.split(/\r?\n/).length:0,"Reading time":`${Math.max(1,Math.ceil(words/200))} min`}};}
  case "chars":{const chars=input.length;return{primary:`${chars} characters`,meta:{"Without spaces":input.replace(/\s/g,"").length,Words:input.trim()?input.trim().split(/\s+/).length:0,Lines:input?input.split(/\r?\n/).length:0}};}
  case "case":{const type=String(options.case||"upper");const outputs:{[k:string]:string}={upper:input.toUpperCase(),lower:input.toLowerCase(),title:input.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),sentence:input.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,c=>c.toUpperCase()),camel:input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g,(_,c)=>c.toUpperCase())};return{primary:outputs[type]};}
  case "dedupe":return{primary:[...new Set(input.split(/\r?\n/))].join("\n")};
  case "sort":return{primary:input.split(/\r?\n/).sort((a,b)=>a.localeCompare(b)).join("\n")};
  case "slug":return{primary:input.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")};
  case "json-format":return{primary:JSON.stringify(JSON.parse(input),null,2),valid:true};
  case "json-valid":JSON.parse(input);return{primary:"Valid JSON",valid:true};
  case "base64":return{primary:options.action==="decode"?decodeURIComponent(escape(atob(input))):btoa(unescape(encodeURIComponent(input)))};
  case "url":return{primary:options.action==="decode"?decodeURIComponent(input):encodeURIComponent(input)};
  case "uuid":return{primary:typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:r&3|8).toString(16)})};
  case "markdown":{const safe=input.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return{primary:safe.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/\n/g,"<br />")};}
  case "regex":{const requested=String(options.flags??"g");const flags=requested.includes("g")?requested:`${requested}g`;const re=new RegExp(String(options.pattern||""),flags);const matches=[...input.matchAll(re)];return{primary:`${matches.length} match${matches.length===1?"":"es"}`,meta:Object.fromEntries(matches.slice(0,6).map((m,i)=>[`Match ${i+1}`,m[0]]))};}
  case "password":{const len=Number(options.length||18),chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";const a=new Uint32Array(len);crypto.getRandomValues(a);return{primary:Array.from(a,n=>chars[n%chars.length]).join("")};}
  case "timestamp":{const n=Number(input||Date.now());const d=new Date(n<1e12?n*1000:n);return{primary:d.toLocaleString(),meta:{ISO:d.toISOString(),Unix:Math.floor(d.getTime()/1000)}};}
  default:return{primary:input};
 }} catch(error){return{primary:error instanceof Error?error.message:"Something went wrong",valid:false};}
}
