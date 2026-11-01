export function calculateRetryDelay(n,{baseDelayMs=1000,maxDelayMs=300000,random=Math.random}={}){return Math.floor(random()*Math.min(maxDelayMs,baseDelayMs*(2**Math.max(0,n-1))));}
export function shouldRetry(code){return code===408||code===425||code===429||code>=500;}
export function matchesEventType(value,type){try{const a=JSON.parse(value||'["*"]');return a.includes("*")||a.includes(type);}catch{return false;}}
export function safeJsonParse(value,fallback=null){try{return JSON.parse(value);}catch{return fallback;}}