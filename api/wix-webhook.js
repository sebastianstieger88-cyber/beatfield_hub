import {wixSettings,webhookAuthorized,importWix,wixRespondError,WixError} from '../lib/wix-server.js';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
  try {
    const env=wixSettings();
    if(!webhookAuthorized(req,env)) throw new WixError(401,'Nicht autorisiert.');
    if(JSON.stringify(req.body||{}).length>4096) throw new WixError(413,'Anfrage zu groß.');
    // Only IDs are accepted; customer data and status are read from Wix itself.
    const result=await importWix(env,req.body.kind,req.body.id);
    return res.status(200).json(result);
  } catch(error){return wixRespondError(res,error);}
}
