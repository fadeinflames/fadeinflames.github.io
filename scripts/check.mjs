import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const routes=['/','/resume/','/projects/','/links/','/meet/'];
let checked=0;
for(const route of routes){
  const html=await readFile(path.join(root,route,'index.html'),'utf8');
  if((html.match(/<h1[ >]/g)||[]).length!==1)throw Error(`${route}: exactly one h1 required`);
  if(!html.includes('lang="ru"')||!html.includes('aria-current="page"'))throw Error(`${route}: language/navigation missing`);
  if(/href="#"|undefined|TODO|Lorem ipsum/.test(html))throw Error(`${route}: unfinished content`);
  for(const match of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)){
    const url=new URL(match[1],'https://fadeinflames.github.io').pathname;
    await access(path.join(root,url,url.endsWith('/')?'index.html':''));
    checked++;
  }
}
console.log(`PASS: 5 pages, headings, current navigation and ${checked} local asset/link references.`);
