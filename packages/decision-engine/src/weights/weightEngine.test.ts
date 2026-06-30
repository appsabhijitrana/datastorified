import {describe,expect,it} from "vitest";import {normalizeWeights} from "./weightEngine";
describe("weight engine",()=>{it("normalizes to 100",()=>expect(normalizeWeights([{id:"a",label:"A",weight:2,explanation:""},{id:"b",label:"B",weight:3,explanation:""}]).reduce((s,x)=>s+x.weight,0)).toBe(100))});
