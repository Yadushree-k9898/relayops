import {createHmac,timingSafeEqual} from "node:crypto";

export async function POST(req) {
  const raw = await req.text();
  const mode = new URL(req.url).searchParams.get("mode") || "success";
  const eventId = req.headers.get("X-RelayOps-Event-Id") || "unknown";
  const timestamp = req.headers.get("X-RelayOps-Timestamp");
  const signature = req.headers.get("X-RelayOps-Signature");
  const secret = process.env.RELAYOPS_DEMO_SECRET;
  if (secret && timestamp && signature) {
    const expected = "sha256=" + createHmac("sha256", secret).update(timestamp + "." + raw).digest("hex");
    const a = Buffer.from(signature), b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a,b)) return Response.json({error:"Invalid signature"},{status:401});
    if (Math.abs(Date.now()/1000 - Number(timestamp)) > 300) return Response.json({error:"Expired signature"},{status:401});
  }
  if (mode === "fail") return Response.json({received:false,eventId,message:"Demo receiver intentionally returned an error."},{status:500});
  if (mode === "rate-limit") return Response.json({received:false,eventId,message:"Demo receiver is rate limiting."},{status:429,headers:{"Retry-After":"10"}});
  if (mode === "slow") await new Promise(resolve => setTimeout(resolve,10000));
  let payload;
  try { payload = JSON.parse(raw); } catch { return Response.json({error:"Invalid JSON"},{status:400}); }
  return Response.json({received:true,eventId,receivedAt:new Date().toISOString(),payload});
}
