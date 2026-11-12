import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const root = process.cwd();
const postsDir = path.join(root, 'posts');
const blogFile = path.join(root, 'blog.html');
const startMarker = '<!-- CMS_ARTICLES_START -->';
const endMarker = '<!-- CMS_ARTICLES_END -->';
const escape = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const safeUrl = (v) => {const s=String(v??''); return /^(https?:\/\/|\/images\/blog\/)/.test(s) ? s : '';};
const template = fs.readFileSync(path.join(root,'psihoterapia-online-sau-la-cabinet.html'),'utf8');
let blog = fs.readFileSync(blogFile,'utf8');
if (!blog.includes(startMarker)) blog = blog.replace('<div class="articles">','<div class="articles">' + startMarker + endMarker);
if (!blog.includes(startMarker)) throw new Error('Nu am gasit containerul de articole din blog.html');
const files = fs.readdirSync(postsDir).filter(f=>f.endsWith('.md'));
const posts = files.map(file=>({file, ...matter(fs.readFileSync(path.join(postsDir,file),'utf8'))})).sort((a,b)=>String(b.data.date??'').localeCompare(String(a.data.date??'')));
const cards=[];
for (const post of posts) {
 const slug=path.basename(post.file,'.md');
 if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Nume articol invalid: '+slug);
 const d=post.data, title=escape(d.title), description=escape(d.description), category=escape(d.category || 'Psihoterapie');
 const url='articol-'+slug+'.html';
 const image=safeUrl(d.image);
 cards.push(`<article class="article-card">${image?`<img src="${escape(image)}" alt="" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:10px;margin-bottom:12px">`:''}<div class="tag">${category}</div><h3>${title}</h3><p>${description}</p><a class="readmore" href="${url}">Citește articolul →</a></article>`);
 const articleHtml=`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Alexandra Duțu</title><meta name="description" content="${description}"><link rel="canonical" href="https://alexandradutu.ro/${url}"><style>${blog.match(/<style>([\s\S]*?)<\/style>/)?.[1]??''}\n.article-full{margin:55px auto}.article-full .cms-body p{white-space:normal}.cms-body img{max-width:100%;height:auto}.cms-body a{text-decoration:underline}.cms-body h2{font-size:30px}</style></head><body><header><div class="wrap"><nav><a class="brand" href="index.html">Alexandra Duțu | Psihoterapeut București</a><div class="links"><a href="index.html">Acasă</a><a href="blog.html">Blog</a><a href="index.html#contact">Contact</a></div></nav></div></header><main class="wrap"><article class="article-full"><a class="back" href="blog.html">← Înapoi la blog</a><div class="eyebrow">${category}</div><h1>${title}</h1>${image?`<img src="${escape(image)}" alt="" style="max-width:100%;border-radius:12px">`:''}<div class="cms-body">${marked.parse(post.content)}</div></article></main><footer><div class="wrap">© Alexandra Duțu · Psihoterapie</div></footer></body></html>`;
 fs.writeFileSync(path.join(root,url),articleHtml);
}
const from=blog.indexOf(startMarker)+startMarker.length;
const to=blog.indexOf(endMarker,from);
if(to<0)throw new Error('Marcator de sfarsit lipsa');
blog=blog.slice(0,from)+cards.join('')+blog.slice(to);
fs.writeFileSync(blogFile,blog);
console.log(`Articole CMS generate: ${posts.length}. Articolele existente au fost pastrate.`);
