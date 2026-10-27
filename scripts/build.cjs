require('./check.cjs');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..'),out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','styles.css','app.js','course.js','lab.js','favicon.svg'])fs.copyFileSync(path.join(root,file),path.join(out,file));
console.log('Built dist/: static website, no external runtime dependencies.');
