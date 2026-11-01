import {prisma} from "@/lib/prisma";
import {isValidHttpUrl,jsonError} from "@/lib/http";
export async function GET(){const rows=await prisma.endpoint.findMany({orderBy:{createdAt:"desc"}});return Response.json({endpoints:rows.map(({eventTypes,...x})=>({...x,eventTypes:JSON.parse(eventTypes)}))});}
export async function POST(req){let b;try{b=await req.json()}catch{return jsonError("Request body must be valid JSON.");}if(!b.name?.trim())return jsonError("Destination name is required.");if(!isValidHttpUrl(b.url))return jsonError("A valid HTTP or HTTPS URL is required.");const types=b.eventTypes||["*"];if(!Array.isArray(types)||!types.length||types.some(x=>typeof x!=="string"))return jsonError("eventTypes must be a non-empty array.");const endpoint=await prisma.endpoint.create({data:{name:b.name.trim(),url:b.url,eventTypes:JSON.stringify(types),secret:typeof b.secret==="string"?b.secret:null}});return Response.json({endpoint:{...endpoint,eventTypes:types}},{status:201});}
export async function PATCH(req) {
  let b; try { b=await req.json(); } catch { return jsonError("Request body must be valid JSON."); }
  if(typeof b.id!=="string"||!b.id) return jsonError("Destination id is required.");
  const data={};
  if(typeof b.enabled==="boolean") data.enabled=b.enabled;
  if(typeof b.name==="string") { if(!b.name.trim()) return jsonError("Destination name cannot be empty."); data.name=b.name.trim(); }
  if(typeof b.url==="string") { if(!isValidHttpUrl(b.url)) return jsonError("A valid, allowed HTTP or HTTPS URL is required."); data.url=b.url; }
  if(Array.isArray(b.eventTypes)) { if(!b.eventTypes.length||b.eventTypes.some(x=>typeof x!=="string")) return jsonError("eventTypes must be a non-empty array."); data.eventTypes=JSON.stringify(b.eventTypes); }
  try {
    const endpoint=await prisma.endpoint.update({where:{id:b.id},data});
    return Response.json({endpoint:{...endpoint,eventTypes:JSON.parse(endpoint.eventTypes)}});
  } catch(e) { if(e.code==="P2025") return jsonError("Destination not found.",404); throw e; }
}
