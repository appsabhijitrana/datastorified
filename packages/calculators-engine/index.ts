export * from "./registry";
export type ResultUnit="currency"|"percent"|"number";
export type CalculationResult={value:number;secondary:Array<{label:string;value:number;unit?:ResultUnit}>;unit:ResultUnit;insight:string;chart?:Array<{name:string;value:number}>};
const pmt=(principal:number,rate:number,years:number)=>{const n=Math.max(1,years*12),r=Math.max(0,rate)/1200;return r===0?principal/n:principal*r*(1+r)**n/((1+r)**n-1)};
export function calculate(slug:string,v:Record<string,number>):CalculationResult {
 v=Object.fromEntries(Object.entries(v).map(([key,value])=>[key,Number.isFinite(value)?Math.max(0,value):0]));
 let value=0,secondary:CalculationResult["secondary"]=[],unit:CalculationResult["unit"]="currency",insight="Small changes today can compound into meaningful progress.",chart;
 switch(slug){
  case "emi-calculator": value=pmt(v.principal,v.rate,v.years); {const total=value*v.years*12,interest=total-v.principal;secondary=[{label:"Total interest",value:interest},{label:"Total repayment",value:total}];chart=[{name:"Principal",value:v.principal},{name:"Interest",value:interest}];insight=`Your EMI uses about ${Math.round(value/(v.principal||1)*100)}% of the principal each month.`;} break;
  case "sip-calculator": {const r=v.rate/1200,n=v.years*12; value=r===0?v.monthly*n:v.monthly*((1+r)**n-1)/r*(1+r);const invested=v.monthly*n;secondary=[{label:"Invested",value:invested},{label:"Wealth gained",value:value-invested}];chart=[{name:"Invested",value:invested},{name:"Gains",value:value-invested}];} break;
  case "fd-calculator": value=v.principal*(1+v.rate/400)**(4*v.years);secondary=[{label:"Interest earned",value:value-v.principal}]; break;
  case "cagr-calculator": value=v.start>0&&v.years>0?((v.end/v.start)**(1/v.years)-1)*100:0;unit="percent";secondary=[{label:"Absolute gain",value:v.end-v.start,unit:"currency"}]; break;
  case "inflation-calculator": value=v.amount*(1+v.rate/100)**v.years;secondary=[{label:"Extra future cost",value:value-v.amount}]; break;
  case "retirement-calculator": {const monthly=v.expense*(1+v.inflation/100)**v.years;const realRate=Math.max(0,(1+v.return/100)/(1+v.inflation/100)-1);value=realRate===0?monthly*12*25:monthly*12*(1-(1+realRate)**-25)/realRate;secondary=[{label:"Future monthly expense",value:monthly}];insight="This estimates 25 years of retirement spending and adjusts the corpus for post-retirement return versus inflation.";} break;
  case "emergency-fund-calculator": value=v.expense*v.months;secondary=[{label:"Monthly essentials",value:v.expense}];insight=v.months>=6?"You are planning a resilient buffer of six months or more.":"Consider moving toward six months of essential expenses.";break;
  case "net-worth-calculator": value=v.assets-v.liabilities;secondary=[{label:"Assets",value:v.assets},{label:"Liabilities",value:v.liabilities}];chart=[{name:"Assets",value:v.assets},{name:"Liabilities",value:v.liabilities}];break;
  case "loan-eligibility-calculator": {const emi=Math.max(0,v.income*.45-v.obligations),r=v.rate/1200,n=v.years*12;value=r===0?emi*n:emi*((1+r)**n-1)/(r*(1+r)**n);secondary=[{label:"Comfortable EMI",value:emi}];}break;
  case "home-affordability-calculator": value=Math.max(0,(v.income*.4-v.obligations)*180+v.savings);secondary=[{label:"Down payment",value:v.savings}];insight="Keeps estimated housing obligations near 40% of monthly income.";break;
  case "gst-calculator": {const tax=v.amount*v.rate/100;value=v.amount+tax;secondary=[{label:"GST amount",value:tax}];}break;
  case "income-tax-calculator": {let x=Math.max(0,v.income-300000);value=Math.min(x,300000)*.05+Math.min(Math.max(0,x-300000),300000)*.1+Math.min(Math.max(0,x-600000),300000)*.15+Math.min(Math.max(0,x-900000),300000)*.2+Math.max(0,x-1200000)*.3;value*=1.04;secondary=[{label:"Effective rate",value:v.income>0?value/v.income*100:0,unit:"percent"}];insight="Simplified planning estimate only; deductions, rebates, cess, and current rules can change the final tax.";}break;
  case "hra-calculator": value=Math.max(0,Math.min(v.hra,v.rent-v.basic*.1,v.basic*(v.metro? .5:.4)));secondary=[{label:"Taxable HRA",value:Math.max(0,v.hra-value)}];break;
  case "age-calculator": value=Math.max(0,v.currentYear-v.birthYear);unit="number";insight="This year-based estimate does not account for the exact birth date.";break;
  case "percentage-calculator": value=v.value*v.percentage/100;unit="number";break;
  case "discount-calculator": value=v.price*(1-v.discount/100);secondary=[{label:"You save",value:v.price-value}];break;
  case "bmi-calculator": value=v.weight/((v.height/100)**2);unit="number";insight=value<18.5?"This sits below the standard healthy BMI range.":value<25?"This sits within the standard healthy BMI range.":"This sits above the standard healthy BMI range; BMI is only a screening measure.";break;
  case "fuel-cost-calculator": value=v.mileage>0?v.distance/v.mileage*v.price:0;secondary=[{label:"Fuel needed (L)",value:v.mileage>0?v.distance/v.mileage:0,unit:"number"}];break;
  case "unit-converter": value=v.value*3.28084;unit="number";break;
  case "currency-converter": value=v.amount*v.rate;insight="Phase 1 demo uses the exchange rate you provide; live market rates are not fetched.";break;
  default:value=0;
 }
 return {value:Number.isFinite(value)?value:0,secondary,unit,insight,chart};
}
