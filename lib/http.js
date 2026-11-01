export function jsonError(message,status=400){return Response.json({error:message},{status});}

function isPrivateIpv4(host) {
  const parts=host.split(".").map(Number);
  if(parts.length!==4||parts.some(x=>!Number.isInteger(x)||x<0||x>255)) return false;
  const [a,b]=parts;
  return a===0||a===10||a===127||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127);
}

export function isValidHttpUrl(value) {
  try {
    const u=new URL(value),host=u.hostname.toLowerCase().replace(/^\[|\]$/g,"");
    if(!["http:","https:"].includes(u.protocol)||u.username||u.password) return false;
    const localDev=process.env.NODE_ENV!=="production";
    if((host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||host==="::1"||host==="::")&&!localDev) return false;
    if(host.startsWith("fc")||host.startsWith("fd")||host.startsWith("fe80:")) return false;
    if(isPrivateIpv4(host)&&!(localDev&&host==="127.0.0.1")) return false;
    return true;
  } catch { return false; }
}
