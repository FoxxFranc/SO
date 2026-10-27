const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
for(const file of ['app.js','course.js','lab.js','server.cjs'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
for(const file of ['package.json','vercel.json'])JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'course.js'),'utf8'),sandbox);
const course=sandbox.window.COURSE;
if(course.lessons.length!==12)throw Error('Expected 12 lessons');
if(new Set(course.lessons.map(l=>l.id)).size!==12)throw Error('Duplicate lesson IDs');
for(const lesson of course.lessons){if(!lesson.body||!lesson.answer||lesson.quiz.length<2||lesson.sources.length<1)throw Error('Incomplete lesson '+lesson.id);for(const q of lesson.quiz){if(!q.options[q.correct]||!q.why)throw Error('Incomplete quiz');}}
console.log(`Checked: syntax, configuration, ${course.lessons.length} lessons, ${course.glossary.length} terms, ${course.interview.length} interview questions.`);
