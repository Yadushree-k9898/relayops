import {describe,it,expect} from "vitest";
import {calculateRetryDelay,shouldRetry,matchesEventType,safeJsonParse} from "./reliability";

describe("retry policy",()=>{
  it("uses capped full jitter",()=>{
    expect(calculateRetryDelay(1,{baseDelayMs:1000,maxDelayMs:5000,random:()=>0.5})).toBe(500);
    expect(calculateRetryDelay(5,{baseDelayMs:1000,maxDelayMs:5000,random:()=>0.5})).toBe(2500);
  });
  it("retries transient HTTP failures only",()=>{
    for(const code of [408,425,429,500,502,503]) expect(shouldRetry(code)).toBe(true);
    for(const code of [200,301,400,401,403,404,422]) expect(shouldRetry(code)).toBe(false);
  });
  it("matches wildcard and explicit event subscriptions",()=>{
    expect(matchesEventType('["*"]',"invoice.paid")).toBe(true);
    expect(matchesEventType('["invoice.paid"]',"invoice.paid")).toBe(true);
    expect(matchesEventType('["invoice.paid"]',"invoice.failed")).toBe(false);
  });
  it("parses JSON safely",()=>{
    expect(safeJsonParse('{"ok":true}')).toEqual({ok:true});
    expect(safeJsonParse("bad",{})).toEqual({});
  });
});
