import {prisma} from "@/lib/prisma";
import {calculateRetryDelay,safeJsonParse,shouldRetry} from "@/lib/reliability";
import {createHmac} from "node:crypto";

async function processJob(job) {
  const claim=await prisma.delivery.updateMany({where:{id:job.id,status:job.status,nextAttemptAt:{lte:new Date()}},data:{status:"processing"}});
  if(!claim.count) return {skipped:true};
  const started=Date.now(),number=job.attemptCount+1;
  let code=null,text=null,error=null,retryAfter=null;
  try {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    const payload=JSON.stringify({id:job.event.id,type:job.event.type,data:safeJsonParse(job.event.payload),createdAt:job.event.createdAt});
    const timestamp=String(Math.floor(Date.now()/1000));
    const headers={"Content-Type":"application/json","X-RelayOps-Event-Id":job.event.id,"X-RelayOps-Event-Type":job.event.type,"X-RelayOps-Timestamp":timestamp};
    if(job.endpoint.secret) headers["X-RelayOps-Signature"]="sha256="+createHmac("sha256",job.endpoint.secret).update(timestamp+"."+payload).digest("hex");
    let response;
    try { response=await fetch(job.endpoint.url,{method:"POST",headers,body:payload,signal:controller.signal,redirect:"manual"}); }
    finally { clearTimeout(timer); }
    code=response.status; retryAfter=response.headers.get("retry-after");
    text=(await response.text()).slice(0,2000);
    if(!response.ok) error=code>=300&&code<400?"Redirect responses are not followed for destination safety.":"Endpoint responded with HTTP "+code;
  } catch(e) { error=e.name==="AbortError"?"Request timed out after 8 seconds":e.message||"Network error"; }
  const ok=code!==null&&code>=200&&code<300;
  const retry=code===null||shouldRetry(code);
  const status=ok?"delivered":(retry&&number<job.maxAttempts?"retrying":"dead_letter");
  let delay=calculateRetryDelay(number,{baseDelayMs:2000,maxDelayMs:900000});
  if(retryAfter) {
    const seconds=Number(retryAfter),date=Date.parse(retryAfter);
    const hinted=Number.isFinite(seconds)?seconds*1000:(Number.isFinite(date)?date-Date.now():0);
    if(hinted>0) delay=Math.min(900000,Math.max(delay,hinted));
  }
  const next=status==="retrying"?new Date(Date.now()+delay):new Date();
  await prisma.$transaction([
    prisma.attempt.create({data:{deliveryId:job.id,attemptNumber:number,status:ok?"succeeded":"failed",statusCode:code,responseBody:text,error,durationMs:Date.now()-started}}),
    prisma.delivery.update({where:{id:job.id},data:{status,attemptCount:number,lastStatusCode:code,lastError:error,nextAttemptAt:next,deliveredAt:ok?new Date():null}})
  ]);
  return {status};
}

export async function POST(req) {
  const adminToken=process.env.RELAYOPS_ADMIN_TOKEN;
  if(adminToken && req.headers.get("Authorization")!=="Bearer "+adminToken) return Response.json({error:"Unauthorized"},{status:401});
  let b={}; try { b=await req.json(); } catch {}
  const limit=Math.min(50,Math.max(1,Number(b.limit)||10));
  const jobs=await prisma.delivery.findMany({where:{status:{in:["queued","retrying"]},nextAttemptAt:{lte:new Date()}},orderBy:[{nextAttemptAt:"asc"},{createdAt:"asc"}],take:limit,include:{event:true,endpoint:true}});
  const results=await Promise.all(jobs.map(processJob));
  return Response.json({processed:results.filter(x=>!x.skipped).length,skipped:results.filter(x=>x.skipped).length,results});
}
