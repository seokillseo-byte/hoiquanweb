const menuButton=document.querySelector(".menu-toggle");const nav=document.querySelector(".primary-nav");if(menuButton&&nav){menuButton.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open));});nav.addEventListener("click",event=>{if(event.target.closest("a")){nav.classList.remove("open");menuButton.setAttribute("aria-expanded","false");}});}
document.querySelectorAll(".faq-item").forEach(item=>{const summary=item.querySelector("summary");const icon=summary?.querySelector("b");if(icon){item.addEventListener("toggle",()=>{icon.textContent=item.open?"×":"+";});}});
const form=document.querySelector("#inquiry-form");if(form){const status=document.querySelector("#form-status");const apiBase=(document.querySelector('meta[name="hq-api-base"]')?.content||"").trim().replace(/\/$/,"");form.addEventListener("submit",async event=>{event.preventDefault();if(!form.reportValidity())return;const data=new FormData(form);const payload={name:String(data.get("name")||"").trim(),email:String(data.get("email")||"").trim(),service:String(data.get("service")||""),consent:true,budget:String(data.get("budget")||"").trim(),goals:String(data.get("goals")||"").trim(),consentAt:new Date().toISOString()};const button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent="";try{if(apiBase){const response=await fetch(apiBase+"/api/leads",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));if(!response.ok||result.ok!==true)throw new Error(result.message||"The inquiry could not be submitted.");status.textContent=document.documentElement.lang==="vi"?"Yêu cầu đã được tiếp nhận.":"Your inquiry has been received.";form.reset();}else{const lines=["HoiQuanWeb project inquiry","Name: "+payload.name,"Email: "+payload.email,"Service: "+payload.service,"Budget: "+payload.budget,"Project details:",payload.goals,"Consent: "+payload.consentAt];const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="hoiquanweb-project-brief.txt";link.click();URL.revokeObjectURL(link.href);status.textContent=document.documentElement.lang==="vi"?"Hệ thống tiếp nhận trực tuyến chưa được kết nối. Bản tóm tắt đã được tải xuống thiết bị; biểu mẫu không gửi dữ liệu lên máy chủ.":"Online submission is not connected yet. A brief has been downloaded to your device; the form did not send data to a server.";}}catch(error){status.textContent=error.message||"Submission failed. Please try again."; }finally{button.disabled=false;}});}

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

void loadCmsPage();
