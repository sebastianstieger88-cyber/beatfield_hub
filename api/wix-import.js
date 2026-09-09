import {wixSettings,requireAdmin,importWix,wixRespondError,WixError} from '../lib/wix-server.js';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).end();}
  try {
    const env=wixSettings();
    await requireAdmin(req,env);
    if(req.method==='GET') return res.status(200).json({configured:true,siteId:env.WIX_SITE_ID});
    if(JSON.stringify(req.body||{}).length>4096) throw new WixError(413,'Anfrage zu groß.');
    return res.status(200).json(await importWix(env,req.body.kind,req.body.id));
  } catch(error){return wixRespondError(res,error);}
}
