'use strict';
// Development preview only. The built output itself needs any ordinary static host.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const values={};for(let i=2;i<process.argv.length;i+=2){if(!['--dir','--port','--base-path'].includes(process.argv[i])||!process.argv[i+1])throw Error('Invalid preview option');values[process.argv[i]]=process.argv[i+1];}
const root=path.resolve(__dirname,'..',values['--dir']||'.'),port=Number(values['--port']||13482),prefix=values['--base-path']||'/';
if(!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(prefix)||!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid prefix or port');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 let url,relative;try{url=new URL(req.url,'http://localhost');if(prefix!=='/'&&url.pathname===prefix.slice(0,-1)){res.writeHead(302,{Location:prefix});return res.end();}if(!url.pathname.startsWith(prefix))throw Error();relative=decodeURIComponent(url.pathname.slice(prefix.length));if(!relative||relative.endsWith('/'))relative+='index.html';}catch{res.writeHead(404);return res.end();}
 const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!mime[path.extname(file)]){res.writeHead(404);return res.end();}
 fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);});
});
server.listen(port,'127.0.0.1',()=>console.log('Static preview: http://127.0.0.1:'+port+prefix));
