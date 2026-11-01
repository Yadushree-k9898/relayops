import {prisma} from "@/lib/prisma";
import {matchesEventType,safeJsonParse} from "@/lib/reliability";
import {jsonError} from "@/lib/http";

export async function GET(req) {
  const p=new URL(req.url).searchParams;
  const limit=Math.min(100,Math.max(1,Number(p.get("limit"))||25));
  const rows=await prisma.delivery.findMany({take:limit,orderBy:{updatedAt:"desc"},include:{event:true,endpoint:true}});
  return Response.json({events:rows.map(d=>({id:d.id,eventId:d.eventId,type:d.event.type,payload:safeJsonParse(d.event.payload),endpointName:d.endpoint.name,endpointUrl:d.endpoint.url,status:d.status,attemptCount:d.attemptCount,maxAttempts:d.maxAttempts,lastStatusCode:d.lastStatusCode,lastError:d.lastError,createdAt:d.createdAt,updatedAt:d.updatedAt,deliveredAt:d.deliveredAt}))});
}

export async function POST(req) {
  let b;
  try { b=await req.json(); } catch { return jsonError("Request body must be valid JSON."); }
  if (!b || typeof b.type!=="string" || !b.type.trim()) return jsonError("Event type is required.");
  if (JSON.stringify(b.data??{}).length > 256_000) return jsonError("Event payload exceeds the 256 KB limit.",413);
  const configuredKey=process.env.RELAYOPS_API_KEY;
  if (configuredKey && req.headers.get("Authorization") !== "Bearer "+configuredKey) return jsonError("A valid producer API key is required.",401);
  const key=req.headers.get("Idempotency-Key")?.trim()||null;
  if (key && key.length>255) return jsonError("Idempotency-Key must be 255 characters or fewer.");
  try {
    const event=await prisma.$transaction(async tx=>{
      const created=await tx.event.create({data:{type:b.type.trim(),payload:JSON.stringify(b.data??{}),idempotencyKey:key}});
      const endpoints=await tx.endpoint.findMany({where:{enabled:true}});
      const matched=endpoints.filter(x=>matchesEventType(x.eventTypes,created.type));
      if(matched.length) await tx.delivery.createMany({data:matched.map(x=>({eventId:created.id,endpointId:x.id}))});
      return {...created,deliveryCount:matched.length};
    });
    return Response.json({event:{...event,payload:safeJsonParse(event.payload)}},{status:202});
  } catch(e) {
    if(e.code==="P2002"&&key) {
      const old=await prisma.event.findUnique({where:{idempotencyKey:key}});
      if(old) return Response.json({event:{...old,payload:safeJsonParse(old.payload)},duplicate:true});
    }
    throw e;
  }
}
