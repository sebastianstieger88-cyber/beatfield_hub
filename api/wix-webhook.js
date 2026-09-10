import {wixSettings,parseWixWebhookBody,webhookAuthorized,webhookAuthDiagnosis,importWix,wixRespondError} from '../lib/wix-server.js';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
  try {
    const env=wixSettings();
    const parsed=parseWixWebhookBody(req.body);
    const incoming={headers:req.headers,body:parsed.body};
    if(!webhookAuthorized(incoming,env)) {
      const diagnostic = {...webhookAuthDiagnosis(incoming,env),shape:parsed.shape};
      console.warn('wix-webhook: authentication rejected', diagnostic);
      return res.status(401).json({error:'Nicht autorisiert.',code:diagnostic.code});
    }
    // Only IDs are accepted; customer data and status are read from Wix itself.
    const result=await importWix(env,parsed.body.kind,parsed.body.id);
    return res.status(200).json(result);
  } catch(error){return wixRespondError(res,error);}
}
