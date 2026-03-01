import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
// Arcjet modes are either LIVE or DRY_RUN; default to LIVE when not explicitly DRY_RUN
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if (!arcjetKey) {
 console.warn('ARCJET_KEY is not set; Arcjet protections are disabled.');
}
export const  httpArcjet =arcjetKey?
arcjet({
    key: arcjetKey,
     characteristics: ["ip.src"], 
    rules:[shield({mode:arcjetMode}),
        detectBot({mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE','CATEGORY:PREVIEW']}),
        slidingWindow({mode: arcjetMode, interval: '10s', max: 50})
    ]
}):null;

export const wsArcjet = arcjetKey?
arcjet({
  key: arcjetKey,
   characteristics: ["ip.src"], 
    rules:[shield({mode:arcjetMode}),
        detectBot({mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE','CATEGORY:PREVIEW']}),
        slidingWindow({mode: arcjetMode, interval: '2s', max: 5})
    ],
    
}):null;

export function securityMiddleware(){
    return async (req,res,next)=>{
        if(!httpArcjet) return next();

        try{
            const decision = await httpArcjet.protect(req);

            if(decision.isDenied()){
                if(decision.reason.isRateLimit()){
                    return res.status(429).json({error:'too many requests.'})
                }
                return res.status(403).json({error:'Forbidden'})
            }
        }catch(e){
            console.error('Arcjet  middleware error',e);
            return res.status(503).json({error:'Service Unavailable'}); 
        }
        next();

    }
}