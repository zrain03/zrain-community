/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: scripts/serve-web.mjs
 * BM: Fail Serve web dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Serve web file according to Zrain Community contracts.
 */
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../web/public');
const port=Number(process.env.PORT)||8767;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  let pathname=decodeURIComponent(url.pathname);
  if(pathname==='/')pathname='/index.html';
  const file=resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const s=await stat(file);if(!s.isFile())throw Error('Not file');
  const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Zrain Community local website: http://127.0.0.1:${port}`));
