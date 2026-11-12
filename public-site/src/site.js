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
void loadCmsPage();
