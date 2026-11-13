const menuButton=document.querySelector(".menu-toggle");const nav=document.querySelector(".primary-nav");if(menuButton&&nav){const setMenuOpen=open=>{nav.classList.toggle("open",open);menuButton.setAttribute("aria-expanded",String(open));menuButton.setAttribute("aria-label",open?menuButton.dataset.closeLabel:menuButton.dataset.openLabel);};menuButton.addEventListener("click",()=>setMenuOpen(menuButton.getAttribute("aria-expanded")!=="true"));nav.addEventListener("click",event=>{if(event.target.closest("a"))setMenuOpen(false);});document.addEventListener("keydown",event=>{if(event.key==="Escape"&&menuButton.getAttribute("aria-expanded")==="true"){setMenuOpen(false);menuButton.focus();}});document.addEventListener("click",event=>{if(menuButton.getAttribute("aria-expanded")==="true"&&!nav.contains(event.target)&&!menuButton.contains(event.target))setMenuOpen(false);});}
document.querySelectorAll(".faq-item").forEach(item=>{const summary=item.querySelector("summary");const icon=summary?.querySelector("b");if(icon){item.addEventListener("toggle",()=>{icon.textContent=item.open?"×":"+";});}});
const form=document.querySelector("#inquiry-form");if(form){const status=document.querySelector("#form-status");const apiBase=(document.querySelector('meta[name="hq-api-base"]')?.content||"").trim().replace(/\/$/,"");const leadApiEnabled=document.querySelector('meta[name="hq-lead-api-enabled"]')?.content==="true";form.addEventListener("submit",async event=>{event.preventDefault();if(!form.reportValidity())return;const data=new FormData(form);const consentInput=form.querySelector('[name="consent"]');const consent=Boolean(consentInput?.checked);const consentAt=consent?new Date().toISOString():null;const payload={name:String(data.get("name")||"").trim(),email:String(data.get("email")||"").trim(),service:String(data.get("service")||""),consent,budget:String(data.get("budget")||"").trim(),goals:String(data.get("goals")||"").trim(),consentAt};const button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent="";try{if(apiBase&&leadApiEnabled&&consent){const response=await fetch(apiBase+"/api/leads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));if(!response.ok||result.ok!==true)throw new Error(result.message||"The inquiry could not be submitted.");status.textContent=document.documentElement.lang==="vi"?"Yêu cầu đã được tiếp nhận.":"Your inquiry has been received.";form.reset();}else{const lines=["HoiQuanWeb project inquiry","Name: "+payload.name,"Email: "+payload.email,"Service: "+payload.service,"Budget: "+payload.budget,"Project details:",payload.goals,"Online submission: disabled; information was not sent to a server."];const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="hoiquanweb-project-brief.txt";link.click();URL.revokeObjectURL(link.href);status.textContent=document.documentElement.lang==="vi"?"Tiếp nhận trực tuyến chưa được kích hoạt. Bản tóm tắt đã được tải xuống; thông tin không được gửi lên máy chủ.":"Online intake is not enabled. The brief has been downloaded; your information was not sent to a server.";}}catch(error){status.textContent=error.message||"Submission failed. Please try again.";}finally{button.disabled=false;}});}

const cmsApiBase=(document.querySelector('meta[name="hq-api-base"]')?.content||"").trim().replace(/\/$/,"");
function cmsText(value){return typeof value==="string"?value:"";}
function cmsSafeUrl(value){
 if(typeof value!=="string"||!value.trim())return null;
 const raw=value.trim();
 if(raw.startsWith("/")||raw.startsWith("#"))return raw;
 try{const parsed=new URL(raw,window.location.origin);return ["http:","https:"].includes(parsed.protocol)?parsed.href:null;}catch{return null;}
}
function cmsElement(tag,text,className){
 const element=document.createElement(tag);
 if(typeof text==="string")element.textContent=text;
 if(className)element.className=className;
 return element;
}
function renderCmsBlocks(main,content){
 const blocks=Array.isArray(content?.blocks)?content.blocks:[];
 if(!blocks.length)return false;
 const fragment=document.createDocumentFragment();
 for(const block of blocks){
  if(!block||typeof block!=="object")continue;
  if(block.type==="heading"){
   const level=Math.max(2,Math.min(4,Number.parseInt(block.level,10)||2));
   fragment.appendChild(cmsElement("h"+level,cmsText(block.text)));
  }else if(block.type==="paragraph"){
   fragment.appendChild(cmsElement("p",cmsText(block.text)));
  }else if(block.type==="list"&&Array.isArray(block.items)){
   const list=cmsElement(block.ordered===true?"ol":"ul");
   for(const item of block.items.slice(0,100))list.appendChild(cmsElement("li",cmsText(item)));
   fragment.appendChild(list);
  }else if(block.type==="quote"){
   const quote=cmsElement("blockquote");
   quote.appendChild(cmsElement("p",cmsText(block.text)));
   if(block.author)quote.appendChild(cmsElement("cite",cmsText(block.author)));
   fragment.appendChild(quote);
  }else if(block.type==="image"){
   const src=cmsSafeUrl(block.src);
   if(!src)continue;
   const figure=cmsElement("figure");
   const image=document.createElement("img");image.src=src;image.alt=cmsText(block.alt);image.loading="lazy";image.decoding="async";
   figure.appendChild(image);
   if(block.caption)figure.appendChild(cmsElement("figcaption",cmsText(block.caption)));
   fragment.appendChild(figure);
  }else if(block.type==="cta"){
   const href=cmsSafeUrl(block.href);
   if(!href)continue;
   const wrap=cmsElement("p","", "cms-cta");
   const link=cmsElement("a",cmsText(block.label)||"Tìm hiểu thêm","button button-primary");
   link.href=href;
   if(/^https?:\/\//i.test(href)&&new URL(href,window.location.origin).origin!==window.location.origin){link.target="_blank";link.rel="noopener noreferrer";}
   wrap.appendChild(link);fragment.appendChild(wrap);
  }else if(block.type==="faq"&&Array.isArray(block.items)){
   const section=cmsElement("section","","cms-faq");
   for(const item of block.items.slice(0,50)){
    const details=document.createElement("details");details.className="faq-item";
    details.appendChild(cmsElement("summary",cmsText(item?.question)));
    details.appendChild(cmsElement("p",cmsText(item?.answer)));
    section.appendChild(details);
   }
   fragment.appendChild(section);
  }else if(block.type==="divider"){
   fragment.appendChild(document.createElement("hr"));
  }
 }
 if(!fragment.childNodes.length)return false;
 main.replaceChildren(fragment);
 main.classList.add("cms-rendered");
 return true;
}
function applyCmsSeo(data){
 const seo=data?.seo&&typeof data.seo==="object"?data.seo:{};
 const title=cmsText(seo.title)||cmsText(data?.title);
 const description=cmsText(seo.description)||cmsText(data?.excerpt);
 if(title)document.title=title+" | HoiQuanWeb";
 if(description){let meta=document.querySelector('meta[name="description"]');if(meta)meta.content=description;}
 if(seo.robots==="noindex")document.querySelector('meta[name="robots"]')?.setAttribute("content","noindex,follow");
}
async function loadCmsPage(){
 if(!cmsApiBase)return;
 const main=document.querySelector("main[data-cms-page]");
 if(!main)return;
 const slug=main.dataset.cmsPage;
 if(!slug)return;
 try{
  const response=await fetch(cmsApiBase+"/api/v1/public/pages/"+encodeURIComponent(slug),{headers:{accept:"application/json"},credentials:"omit"});
  if(!response.ok)return;
  const result=await response.json();
  const data=result?.data;
  if(data&&renderCmsBlocks(main,data.content))applyCmsSeo(data);
 }catch{/* Keep the generated static page as the safe fallback. */}
}

function blogCanonical(slug){
 const link=document.querySelector('link[rel="canonical"]');
 if(!link)return;
 const url=new URL(window.location.href);
 url.search="";
 url.hash="";
 if(slug)url.searchParams.set("slug",slug);
 link.href=url.href;
 const og=document.querySelector('meta[property="og:url"]');
 if(og)og.content=url.href;
}
function blogMeta(data){
 const title=cmsText(data?.seo?.title)||cmsText(data?.title);
 const description=cmsText(data?.seo?.description)||cmsText(data?.excerpt);
 if(title)document.title=title+" | HoiQuanWeb";
 if(description){
  const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=description;
  const og=document.querySelector('meta[property="og:description"]');if(og)og.content=description;
 }
 const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle&&title)ogTitle.content=title;
 blogCanonical(data?.slug);
 const robots=data?.seo?.robots;
 if(robots==="noindex")document.querySelector('meta[name="robots"]')?.setAttribute("content","noindex,follow");
}
function blogDate(value,lang){
 const date=new Date(value);
 return Number.isNaN(date.getTime())?"":new Intl.DateTimeFormat(lang==="vi"?"vi-VN":"en-US",{year:"numeric",month:"long",day:"numeric"}).format(date);
}
async function loadBlog(){
 const root=document.querySelector("[data-blog-list]");
 if(!root)return;
 const lang=root.dataset.language==="en"?"en":"vi";
 const labels=lang==="vi"?{loading:"Đang tải bài viết…",empty:"Chưa có bài viết được xuất bản.",error:"Không tải được bài viết. Vui lòng thử lại.",category:"Tất cả danh mục",more:"Tải thêm",search:"Tìm kiếm",read:"Đọc bài viết",author:"Tác giả"}:{loading:"Loading articles…",empty:"No published articles yet.",error:"Could not load articles. Please try again.",category:"All categories",more:"Load more",search:"Search",read:"Read article",author:"By"};
 const form=root.querySelector("[data-blog-filter]");
 const results=root.querySelector("[data-blog-results]");
 const status=root.querySelector("[data-blog-status]");
 const more=root.querySelector("[data-blog-more]");
 const category=form.elements.category;
 let offset=0,loading=false,hasMore=true;
 function statusText(value,error=false){status.textContent=value;status.classList.toggle("is-error",error);}
 function card(item){
  const article=cmsElement("article","","blog-card");
  const meta=cmsElement("div","","blog-card-meta");
  if(item.category)meta.appendChild(cmsElement("span",cmsText(item.category),"blog-category"));
  if(item.published_at)meta.appendChild(cmsElement("time",blogDate(item.published_at,lang),"blog-date"));
  article.appendChild(meta);
  article.appendChild(cmsElement("h2",cmsText(item.title)));
  if(item.excerpt)article.appendChild(cmsElement("p",cmsText(item.excerpt),"blog-excerpt"));
  if(item.author_name)article.appendChild(cmsElement("p",labels.author+" "+cmsText(item.author_name),"blog-author"));
  if(Array.isArray(item.tags)&&item.tags.length){
   const tags=cmsElement("ul","","blog-tags");
   for(const tag of item.tags.slice(0,6))tags.appendChild(cmsElement("li",cmsText(tag)));
   article.appendChild(tags);
  }
  const link=cmsElement("a",labels.read,"button button-outline");
  const seo=item?.seo&&typeof item.seo==="object"?item.seo:{};
  const cleanSlug=typeof item.slug==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug);
  const seoReady=typeof seo.title==="string"&&seo.title.trim().length>=10&&seo.title.trim().length<=240&&typeof seo.description==="string"&&seo.description.trim().length>=50&&seo.description.trim().length<=320;
  const basePath=root.dataset.basePath||"";
  if(seo.indexable===true&&seo.locale===lang&&cleanSlug&&seoReady)link.href=basePath+(lang==="vi"?"/blog/":"/en/blog/")+item.slug+"/";
  else link.href=basePath+root.dataset.detailPath+"?slug="+encodeURIComponent(item.slug);
  article.appendChild(link);
  return article;
 }
 async function load(reset=true){
  if(loading)return;
  if(reset){offset=0;hasMore=true;results.replaceChildren();}
  if(!hasMore&&!reset)return;
  loading=true;more.disabled=true;statusText(labels.loading);
  try{
   const params=new URLSearchParams({limit:"20",offset:String(offset),locale:lang});
   const query=form.elements.q.value.trim();
   if(query)params.set("q",query);
   if(category.value)params.set("category",category.value);
   const response=await fetch(cmsApiBase+"/api/v1/public/posts?"+params.toString(),{headers:{accept:"application/json"},credentials:"omit"});
   if(!response.ok)throw new Error("HTTP "+response.status);
   const data=await response.json(),items=Array.isArray(data.data)?data.data:[];
   if(!items.length&&reset)results.replaceChildren(cmsElement("p",labels.empty,"blog-empty"));
   for(const item of items)results.appendChild(card(item));
   offset+=items.length;hasMore=items.length===20;more.hidden=!hasMore;
   statusText(items.length?String(offset)+(lang==="vi"?" bài viết đã tải.":" articles loaded."):labels.empty);
  }catch{if(reset)results.replaceChildren(cmsElement("p",labels.error,"blog-empty"));statusText(labels.error,true);}
  finally{loading=false;more.disabled=false;more.textContent=labels.more;}
 }
 async function loadCategories(){
  try{
   const response=await fetch(cmsApiBase+"/api/v1/public/post-categories?locale="+encodeURIComponent(lang),{headers:{accept:"application/json"},credentials:"omit"});
   if(!response.ok)return;
   const data=await response.json();
   for(const item of data.data||[]){
    const option=document.createElement("option");option.value=item.category;
    option.textContent=item.category+" ("+item.post_count+")";category.appendChild(option);
   }
  }catch{/* Category filter remains usable with the all-categories option. */}
 }
 if(!cmsApiBase){statusText(lang==="vi"?"Blog sẽ hiển thị khi CMS được kết nối.":"The blog will appear when the CMS is connected.");more.hidden=true;return;}
 form.addEventListener("submit",event=>{event.preventDefault();load(true);});
 category.addEventListener("change",()=>load(true));
 more.addEventListener("click",()=>load(false));
 await loadCategories();await load(true);
}
async function loadBlogPost(){
 const main=document.querySelector("[data-blog-post]");
 if(!main)return;
 const lang=main.dataset.language==="en"?"en":"vi";
 const slug=new URLSearchParams(window.location.search).get("slug")||"";
 const labels=lang==="vi"?{loading:"Đang tải bài viết…",missing:"Không tìm thấy bài viết hoặc bài viết chưa được xuất bản.",back:"← Quay lại kiến thức",author:"Tác giả"}:{loading:"Loading article…",missing:"Article not found or not published.",back:"← Back to insights",author:"By"};
 const backPath=main.dataset.blogPath;
 if(!slug){main.replaceChildren(cmsElement("p",labels.missing,"blog-empty"));return;}
 main.replaceChildren(cmsElement("p",labels.loading,"blog-status"));
 if(!cmsApiBase){main.replaceChildren(cmsElement("p",lang==="vi"?"Nội dung bài viết chưa được kết nối.":"Article content is not connected yet.","blog-empty"));return;}
 try{
  const response=await fetch(cmsApiBase+"/api/v1/public/posts/"+encodeURIComponent(slug),{headers:{accept:"application/json"},credentials:"omit"});
  if(response.status===404){main.replaceChildren(cmsElement("p",labels.missing,"blog-empty"));return;}
  if(!response.ok)throw new Error("HTTP "+response.status);
  const result=await response.json(),post=result?.data;
  if(!post)throw new Error("Missing article data");
  blogMeta(post);
  const article=cmsElement("article","","blog-article");
  const header=cmsElement("header","","blog-article-header");
  const meta=cmsElement("div","","blog-card-meta");
  if(post.category)meta.appendChild(cmsElement("span",cmsText(post.category),"blog-category"));
  if(post.published_at)meta.appendChild(cmsElement("time",blogDate(post.published_at,lang),"blog-date"));
  header.appendChild(meta);
  header.appendChild(cmsElement("h1",cmsText(post.title)));
  if(post.excerpt)header.appendChild(cmsElement("p",cmsText(post.excerpt),"blog-excerpt"));
  if(post.author_name)header.appendChild(cmsElement("p",labels.author+" "+cmsText(post.author_name),"blog-author"));
  article.appendChild(header);
  const content=cmsElement("div","","cms-rendered blog-article-content");
  if(!renderCmsBlocks(content,post.body)){content.appendChild(cmsElement("p",lang==="vi"?"Nội dung đang được cập nhật.":"Content is being updated."));}
  article.appendChild(content);
  if(Array.isArray(post.tags)&&post.tags.length){
   const tags=cmsElement("ul","","blog-tags blog-article-tags");
   for(const tag of post.tags)tags.appendChild(cmsElement("li",cmsText(tag)));
   article.appendChild(tags);
  }
  const back=cmsElement("a",labels.back,"blog-back");back.href=backPath;article.appendChild(back);
  main.replaceChildren(article);
  const canonical=document.querySelector('link[rel="canonical"]');
  if(canonical){const url=new URL(backPath,window.location.origin);url.searchParams.set("slug",post.slug);canonical.href=url.href;}
  const schema={"@context":"https://schema.org","@type":"Article","headline":post.title,"description":post.excerpt||"","datePublished":post.published_at,"author":post.author_name?{"@type":"Person","name":post.author_name}:{"@type":"Organization","name":"HoiQuanWeb"},"mainEntityOfPage":window.location.href};
  const script=document.querySelector('script[type="application/ld+json"]');if(script)script.textContent=JSON.stringify(schema);
 }catch{main.replaceChildren(cmsElement("p",lang==="vi"?"Không tải được bài viết. Vui lòng thử lại sau.":"Could not load this article. Please try again later.","blog-empty"));}
}
async function loadTemplateCatalog(){
 const catalogs=[...document.querySelectorAll("[data-template-catalog]")];
 for(const root of catalogs){
  const form=root.querySelector("[data-template-search]");
  const results=root.querySelector("[data-template-results]");
  const status=root.querySelector("[data-template-status]");
  const more=root.querySelector("[data-template-more]");
  const lang=root.dataset.language==="en"?"en":"vi";
  const labels=lang==="vi"?{wordpress:"WordPress",html_css:"HTML/CSS",version:"Phiên bản",license:"License",preview:"Xem demo",contact:"Tư vấn triển khai",empty:"Chưa có template phù hợp.",missing:"Kho template sẽ hiển thị khi hệ thống catalog được kết nối.",error:"Không tải được catalog. Vui lòng thử lại hoặc liên hệ tư vấn.",loading:"Đang tải…",more:"Đang tải thêm…"}:{wordpress:"WordPress",html_css:"HTML/CSS",version:"Version",license:"License",preview:"Live preview",contact:"Discuss implementation",empty:"No matching templates yet.",missing:"The template catalog will appear when the catalog service is connected.",error:"Could not load the catalog. Please retry or contact us.",loading:"Loading…",more:"Loading more…"};
  let offset=0,loading=false,hasMore=true;
  function setStatus(message,error=false){status.textContent=message;status.classList.toggle("is-error",error);}
  function templateCard(item){
   const card=cmsElement("article","","template-card");
   const thumbUrl=cmsSafeUrl(item.thumbnail_url);
   if(thumbUrl){const figure=cmsElement("figure","","template-thumb");const image=document.createElement("img");image.src=thumbUrl;image.alt=cmsText(item.name);image.loading="lazy";image.decoding="async";figure.appendChild(image);card.appendChild(figure);}
   const meta=cmsElement("div","","template-card-meta");meta.appendChild(cmsElement("span",labels[item.template_type]||item.template_type,"template-type"));if(item.category)meta.appendChild(cmsElement("span",item.category,"template-category"));card.appendChild(meta);
   card.appendChild(cmsElement("h2",cmsText(item.name)));
   if(item.summary)card.appendChild(cmsElement("p",cmsText(item.summary),"template-summary"));
   if(item.description)card.appendChild(cmsElement("p",cmsText(item.description),"template-description"));
   const details=cmsElement("p","","template-details");if(item.version)details.appendChild(cmsElement("span",labels.version+": "+item.version));if(item.license_key)details.appendChild(cmsElement("span",labels.license+": "+String(item.license_key).replace(/_/g," ")));card.appendChild(details);
   const price=cmsElement("p",Number(item.price_minor||0)>0?new Intl.NumberFormat(lang==="vi"?"vi-VN":"en-US",{style:"currency",currency:item.currency||"VND"}).format(Number(item.price_minor)/(10**new Intl.NumberFormat("en-US",{style:"currency",currency:item.currency||"VND"}).resolvedOptions().maximumFractionDigits)):(lang==="vi"?"Liên hệ để nhận báo giá":"Request a quote"),"template-price");card.appendChild(price);
   if(Array.isArray(item.tags)&&item.tags.length){const tags=cmsElement("ul","","template-tags");for(const tag of item.tags.slice(0,8))tags.appendChild(cmsElement("li",cmsText(tag)));card.appendChild(tags);}
   const actions=cmsElement("div","","template-card-actions");
   const previewUrl=cmsSafeUrl(item.preview_url);
   if(previewUrl){const preview=cmsElement("a",labels.preview,"button button-outline");preview.href=previewUrl;preview.target="_blank";preview.rel="noopener noreferrer";actions.appendChild(preview);}
   const contact=cmsElement("a",labels.contact,"button button-primary");contact.href=root.dataset.contact;actions.appendChild(contact);card.appendChild(actions);
   return card;
  }
  async function load(reset=true){
   if(loading)return;if(!cmsApiBase){results.replaceChildren(cmsElement("p",labels.missing,"template-empty"));more.hidden=true;setStatus("");return;}
   if(reset){offset=0;hasMore=true;results.replaceChildren();}
   if(!hasMore&&!reset)return;
   loading=true;more.disabled=true;more.textContent=labels.loading;setStatus(reset?labels.loading:labels.more);
   try{
    const params=new URLSearchParams({limit:"20",offset:String(offset)});
    const query=form.elements.q.value.trim(),type=form.elements.type.value;
    if(query)params.set("q",query);if(type)params.set("type",type);
    const response=await fetch(cmsApiBase+"/api/v1/public/templates?"+params.toString(),{headers:{accept:"application/json"},credentials:"omit"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    const result=await response.json(),items=Array.isArray(result.data)?result.data:[];
    if(reset&&!items.length)results.replaceChildren(cmsElement("p",labels.empty,"template-empty"));
    else for(const item of items)results.appendChild(templateCard(item));
    offset+=items.length;hasMore=items.length===20;more.hidden=!hasMore;
    setStatus(items.length?String(offset)+(lang==="vi"?" template đã tải.":" templates loaded."):"");
   }catch{setStatus(labels.error,true);if(reset)results.replaceChildren(cmsElement("p",labels.error,"template-empty"));}
   finally{loading=false;more.disabled=false;more.textContent=lang==="vi"?"Tải thêm":"Load more";}
  }
  form.addEventListener("submit",event=>{event.preventDefault();load(true);});
  form.elements.type.addEventListener("change",()=>load(true));
  more.addEventListener("click",()=>load(false));
  await load(true);
 }
}
void loadTemplateCatalog();
void loadBlog();
void loadBlogPost();
void loadCmsPage();
