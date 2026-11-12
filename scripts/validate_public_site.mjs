import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = join(process.cwd(), "public-site", "dist");
async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function walk(dir) {
  const entries = await readdir(dir,{withFileTypes:true});
  const out=[];
  for(const entry of entries){const path=join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(path));else out.push(path);}
  return out;
}
assert.ok(await exists(join(root,"index.html")),"Vietnamese homepage must exist");
assert.ok(await exists(join(root,"en","index.html")),"English homepage must exist");
assert.ok(await exists(join(root,"assets","css","site.css")),"Generated CSS must exist");
assert.ok(await exists(join(root,"assets","js","site.js")),"Generated JavaScript must exist");
const files=(await walk(root)).filter(path=>path.endsWith(".html"));
assert.ok(files.length>=30,"Expected a complete bilingual set of public pages");
const errors=[];
for(const file of files){
  const html=await readFile(file,"utf8");
  const name=relative(root,file).split(sep).join("/");
  for(const [label,pattern] of [
    ["doctype",/^<!doctype html>/i],
    ["language",/<html lang="(vi|en)">/],
    ["title",/<title>[^<]{3,}<\/title>/],
    ["description",/<meta name="description" content="[^"]{20,}">/],
    ["canonical",/<link rel="canonical" href="https:\/\/hoiquanweb\.io\.vn\/[^"]*">/],
    ["Vietnamese hreflang",/hreflang="vi"/],
    ["English hreflang",/hreflang="en"/],
    ["main landmark",/<main id="main">/],
    ["site stylesheet",/\/assets\/css\/site\.css/],
    ["site script",/\/assets\/js\/site\.js/]
  ]) if(!pattern.test(html)) errors.push(name+": missing "+label);
  if(/REPLACE_ME|TODO|Lorem ipsum|example\.com/i.test(html)) errors.push(name+": contains placeholder content");
}
const sitemap=await readFile(join(root,"sitemap.xml"),"utf8");
assert.ok(sitemap.includes("https://hoiquanweb.io.vn/"),"Sitemap must use the production domain");
assert.ok((sitemap.match(/<url>/g)||[]).length>=30,"Sitemap must include the bilingual page set");
const css=await readFile(join(root,"assets","css","site.css"),"utf8");
const js=await readFile(join(root,"assets","js","site.js"),"utf8");
assert.ok(css.includes("#155EEF")&&css.includes("#0B1F3A")&&css.includes("#38BDF8"),"Brand colors must match the approved palette");
assert.ok(js.includes("/api/leads"),"Inquiry form must use the existing lead API when configured");
assert.ok(js.includes("hoiquanweb-project-brief.txt"),"Unconfigured API must not report a false successful submission");
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("Public site validation passed: "+files.length+" HTML pages, localized metadata, sitemap, assets, brand tokens and inquiry fallback.");
