const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=__dirname;
const allowed=new Set(['index.html','styles.css','app.js','course.js','lab.js','favicon.svg']);
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
let port=4173,attempts=0;
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end('Method Not Allowed');return;}
  let name;
  try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end('Bad Request');return;}
  if(!allowed.has(name)){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not Found');return;}
  fs.readFile(path.join(root,name),(err,content)=>{
    if(err){res.writeHead(500);res.end('Unable to read file');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(name)]+'; charset=utf-8','Content-Length':content.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:content);
  });
});
server.on('error',error=>{
  if(error.code==='EADDRINUSE'&&attempts++<20){port++;server.listen(port,'127.0.0.1');}
  else{console.error('Could not start local server:',error.message);process.exitCode=1;}
});
server.once('listening',()=>{
  const url='http://localhost:'+port;
  console.log('\n  IT bez paniki\n  Local: '+url+'\n  Press Ctrl+C or close this window to stop.\n');
  if(process.argv.includes('--open')){
    const command=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open';
    const args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
    const browser=spawn(command,args,{detached:true,stdio:'ignore',windowsHide:true});
    browser.on('error',()=>console.log('Open this URL manually: '+url));browser.unref();
  }
});
server.listen(port,'127.0.0.1');
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
