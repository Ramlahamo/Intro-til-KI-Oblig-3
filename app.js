const DAYS=["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag","Søndag"];
const CATS={UNI:{label:"Uni",class:"uni",emoji:"🎓"},JOBB:{label:"Jobb",class:"jobb",emoji:"💼"},PERSONAL:{label:"Personal",class:"personal",emoji:"🌿"}};
const KEY="luma-calendar-events";
let events=JSON.parse(localStorage.getItem(KEY)||"null")||[
 {id:1,title:"DATA3800",cat:"UNI",date:"2026-08-18",start:"10:30",end:"12:15",loc:"P32 N040",recurring:true},
 {id:2,title:"DAVE3625",cat:"UNI",date:"2026-08-18",start:"14:30",end:"16:15",loc:"PP35 U2005",recurring:true},
 {id:3,title:"Trening",cat:"PERSONAL",date:"2026-08-19",start:"18:00",end:"19:00",loc:"",recurring:true},
 {id:4,title:"Vy",cat:"JOBB",date:"2026-08-21",start:"15:00",end:"23:00",loc:""},
 {id:5,title:"TA-vakt",cat:"JOBB",date:"2026-08-20",start:"12:00",end:"15:00",loc:"P35 PS439"}
];
let currentView="MAIN", filter="ALL", weekStart=getMonday(new Date("2026-08-17T12:00:00")), calendarMode="week", monthStart=new Date(2026,7,1), lastWeekStart=new Date(weekStart);
let pendingICS=[];

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function migrateEvents(){
  let changed=false;
  events=events.map(e=>{
    if(e.cat==="TA"){changed=true;return {...e,cat:"JOBB"};}
    return e;
  });
  if(changed)save();
}
function save(){localStorage.setItem(KEY,JSON.stringify(events))}
function getMonday(d){d=new Date(d);const n=d.getDay();const diff=n===0?-6:1-n;d.setDate(d.getDate()+diff);d.setHours(0,0,0,0);return d}
function iso(d){return d.toISOString().slice(0,10)}
function fmtDate(d){return new Intl.DateTimeFormat("no-NO",{day:"numeric",month:"short"}).format(d)}
function weekNo(d){const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil((((x-y)/86400000)+1)/7)}
function selectedEvents(){
 const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);
 const shown=[];
 events.forEach(e=>{
   if(e.recurring){
     const base=new Date(e.date+"T12:00:00");
     const day=(base.getDay()+6)%7;
     const d=new Date(weekStart);d.setDate(d.getDate()+day);
     const copy={...e,date:iso(d)};
     shown.push(copy);
   }else{
     const d=new Date(e.date+"T12:00:00");
     if(d>=new Date(weekStart.getTime()-86400000) && d<=weekEnd) shown.push(e);
   }
 });
 return shown.filter(e=>currentView==="MAIN"||(e.cat===currentView)).filter(e=>filter==="ALL"||e.title===filter)
}
function setView(v){currentView=v;filter="ALL";$("#viewSelect").innerHTML=v+" <span>⌄</span>";$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===v));$("#dropdown").classList.remove("open");render()}
function render(){
 const end=new Date(weekStart);end.setDate(end.getDate()+6);
 if(calendarMode==="month"){
   const y=monthStart.getFullYear(),m=monthStart.getMonth();
   const label=new Intl.DateTimeFormat("no-NO",{month:"long",year:"numeric"}).format(monthStart);
   $("#pageTitle").textContent=label.charAt(0).toUpperCase()+label.slice(1);
   $("#pageSubtitle").textContent="Hele måneden";
 }else{
   $("#pageTitle").textContent=`Uke ${weekNo(weekStart)}`;
   $("#pageSubtitle").textContent=`${fmtDate(weekStart)}–${fmtDate(end)} ${weekStart.getFullYear()}`;
 }
 $("#eyebrow").textContent=currentView==="MAIN"?"ALL EVENTS":CATS[currentView]?.label.toUpperCase()||currentView;
 renderFilters();
 renderCalendar();
 renderOverview();
 renderStats();
}
function renderFilters(){
 const f=$("#filters");f.innerHTML="";
 if(currentView==="UNI"){
   const subjects=[...new Set(events.filter(e=>e.cat==="UNI").map(e=>e.title).filter(Boolean))].sort();
   ["ALL",...subjects].forEach(v=>addFilter(f,v,v==="ALL"?"Alle fag":v));
 } else if(currentView==="JOBB"){
   const jobs=[...new Set(events.filter(e=>e.cat==="JOBB").map(e=>e.title).filter(Boolean))].sort();
   ["ALL",...jobs].forEach(v=>addFilter(f,v,v==="ALL"?"Alle jobber":"💼 "+v));
 } else if(currentView==="PERSONAL"){
   const personal=[...new Set(events.filter(e=>e.cat==="PERSONAL").map(e=>e.title).filter(Boolean))].sort();
   ["ALL",...personal].forEach(v=>addFilter(f,v,v==="ALL"?"Alle":"🌿 "+v));
 }
}
function addFilter(parent,v,text){const b=document.createElement("button");b.className="filter"+(filter===v?" active":"");b.textContent=text;b.onclick=()=>{filter=v;render()};parent.appendChild(b)}
function eventsForRange(start,end){
 const shown=[];
 events.forEach(e=>{
   const base=new Date(e.date+"T12:00:00");
   if(e.recurring){
     const day=(base.getDay()+6)%7;
     const first=new Date(start);
     const effectiveStart=new Date(Math.max(first.getTime(),base.getTime()));
     const offset=(day-(effectiveStart.getDay()+6)%7+7)%7;
     const d=new Date(effectiveStart);
     d.setDate(effectiveStart.getDate()+offset);
     if(d<base)d.setDate(d.getDate()+7);
     for(;d<=end;d.setDate(d.getDate()+7)) shown.push({...e,date:iso(d)});
   }else if(base>=start&&base<=end){ shown.push(e); }
 });
 return shown.filter(e=>currentView==="MAIN"||e.cat===currentView).filter(e=>filter==="ALL"||e.title===filter);
}
function selectedEvents(){
 const end=new Date(weekStart);end.setDate(end.getDate()+6);
 return eventsForRange(new Date(weekStart),end);
}
function ensureWeekGrid(){
 const card=$("#calendarGrid");
 if(card.querySelector(".day-head") && card.querySelector(".day-col") && card.querySelector("#timeCol")) return;
 card.className="calendar-grid";
 card.innerHTML=`<div class="time-head"></div>
 ${DAYS.map((_,i)=>`<div class="day-head" data-day="${i}"></div>`).join("")}
 <div class="time-col" id="timeCol"></div>
 ${DAYS.map((_,i)=>`<div class="day-col" data-col="${i}"></div>`).join("")}`;
}
function renderCalendar(){
 if(calendarMode==="month") return renderMonthCalendar();
 ensureWeekGrid();
 const heads=$$(".day-head"), cols=$$(".day-col"), tc=$("#timeCol"), shown=selectedEvents();
 heads.forEach((h,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);h.innerHTML=`${DAYS[i].slice(0,3)}<span class="num">${d.getDate()}</span>`;h.classList.toggle("today",iso(d)===iso(new Date()))});
 tc.innerHTML="";for(let h=7;h<=23;h++){const x=document.createElement("div");x.className="time-label";x.textContent=String(h).padStart(2,"0")+":00";tc.appendChild(x)}
 cols.forEach(c=>c.innerHTML="");
 shown.forEach(e=>{
   const d=new Date(e.date+"T12:00:00"),day=(d.getDay()+6)%7;
   const [sh,sm]=e.start.split(":").map(Number),[eh,em]=e.end.split(":").map(Number);
   const top=((sh-7)*60+sm),height=Math.max(38,(eh*60+em)-(sh*60+sm));
   const el=document.createElement("div");el.className=`event ${CATS[e.cat]?.class||"uni"} ${currentView==="MAIN"?"main":""}`;
   el.style.top=top+"px";el.style.height=height+"px";
   el.innerHTML=`<strong>${CATS[e.cat]?.emoji||""} ${e.title}</strong><small>${e.start}–${e.end}${e.loc?" · "+e.loc:""}</small>`;
   el.onclick=()=>editEvent(e.id);cols[day].appendChild(el);
 });
}
function renderMonthCalendar(){
 const card=$("#calendarGrid");
 card.className="calendar-grid month-grid";
 card.innerHTML="";
 DAYS.forEach(d=>{const h=document.createElement("div");h.className="month-weekday";h.textContent=d.slice(0,3);card.appendChild(h)});
 const first=new Date(monthStart.getFullYear(),monthStart.getMonth(),1);
 const offset=(first.getDay()+6)%7;
 const gridStart=new Date(first);gridStart.setDate(1-offset);
 const gridEnd=new Date(gridStart);gridEnd.setDate(gridStart.getDate()+41);
 const shown=eventsForRange(gridStart,gridEnd);
 for(let i=0;i<42;i++){
   const d=new Date(gridStart);d.setDate(gridStart.getDate()+i);
   const cell=document.createElement("div");cell.className="month-cell";
   if(d.getMonth()!==monthStart.getMonth())cell.classList.add("outside");
   if(iso(d)===iso(new Date()))cell.classList.add("today");
   cell.innerHTML=`<div class="month-date">${d.getDate()}</div>`;
   shown.filter(e=>e.date===iso(d)).slice(0,5).forEach(e=>{
     const item=document.createElement("div");item.className=`month-event ${CATS[e.cat]?.class||"uni"}`;item.textContent=`${e.start} ${e.title}`;item.title=`${e.title} ${e.start}–${e.end}`;item.onclick=()=>editEvent(e.id);cell.appendChild(item);
   });
   const more=shown.filter(e=>e.date===iso(d)).length-5;
   if(more>0){const m=document.createElement("div");m.className="month-more";m.textContent=`+${more} flere`;cell.appendChild(m)}
   cell.onclick=(ev)=>{if(ev.target===cell||ev.target.classList.contains("month-date")){openModal(iso(d));$("#eventForm").reset();$("#eventDate").value=iso(d);$("#eventForm").dataset.edit=""}};
   card.appendChild(cell);
 }
}
function renderOverview(){
 const box=$("#overviewCards");const shown=selectedEvents();const counts={UNI:0,JOBB:0,PERSONAL:0};
 shown.forEach(e=>counts[e.cat]++);
 box.innerHTML=Object.entries(CATS).filter(([k])=>currentView==="MAIN"||k===currentView).map(([k,c])=>`<div class="overview-card"><div class="label">${c.emoji} ${c.label.toUpperCase()}</div><div class="value">${counts[k]} aktivitet${counts[k]===1?"":"er"}</div></div>`).join("")||`<div class="overview-card">Ingen aktiviteter.</div>`;
 $("#summaryTitle").textContent=currentView==="MAIN"?"Denne uka":`${CATS[currentView]?.label||currentView} denne uka`;
}
function hours(cat){return events.filter(e=>e.cat===cat).reduce((a,e)=>a+(mins(e.end)-mins(e.start))/60,0)}
function mins(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function renderStats(){$("#uniHours").textContent=hours("UNI")+"t";$("#jobHours").textContent=hours("JOBB")+"t"}
function openModal(date){$("#modalBackdrop").classList.add("open");$("#eventDate").value=date||iso(weekStart)}
function closeModal(){$("#modalBackdrop").classList.remove("open")}
function editEvent(id){const e=events.find(x=>x.id===id);if(!e)return;openModal(e.date);$("#eventTitle").value=e.title;$("#eventCategory").value=e.cat;$("#eventStart").value=e.start;$("#eventEnd").value=e.end;$("#eventLocation").value=e.loc||"";$("#eventRecurring").checked=!!e.recurring;$("#eventNotes").value=e.notes||"";$("#eventForm").dataset.edit=id}
$("#newBtn").onclick=()=>{openModal();$("#eventForm").reset();$("#eventDate").value=iso(weekStart);$("#eventForm").dataset.edit=""}
$("#closeModal").onclick=closeModal;
$("#modalBackdrop").onclick=e=>{if(e.target.id==="modalBackdrop")closeModal()}
$("#eventForm").onsubmit=e=>{e.preventDefault();const data={title:$("#eventTitle").value,cat:$("#eventCategory").value,date:$("#eventDate").value,start:$("#eventStart").value,end:$("#eventEnd").value,loc:$("#eventLocation").value,recurring:$("#eventRecurring").checked,notes:$("#eventNotes").value};const id=$("#eventForm").dataset.edit;if(id){Object.assign(events.find(x=>String(x.id)===id),data)}else{events.push({id:Date.now(),...data})}save();closeModal();toast("Aktivitet lagret");render()}
$("#viewSelect").onclick=()=>$("#dropdown").classList.toggle("open");
$$(".dropdown button").forEach(b=>b.onclick=()=>setView(b.dataset.view));
$$(".nav-item").forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.addEventListener("click",e=>{if(!e.target.closest(".view-select-wrap"))$("#dropdown").classList.remove("open")});
$("#prevWeek").onclick=()=>{
 if(calendarMode==="month")monthStart=new Date(monthStart.getFullYear(),monthStart.getMonth()-1,1);
 else weekStart.setDate(weekStart.getDate()-7);
 migrateEvents();
render();
};
$("#nextWeek").onclick=()=>{
 if(calendarMode==="month")monthStart=new Date(monthStart.getFullYear(),monthStart.getMonth()+1,1);
 else weekStart.setDate(weekStart.getDate()+7);
 render();
};
$("#todayBtn").onclick=()=>{
  const today=new Date();
  weekStart=getMonday(today);
  monthStart=new Date(today.getFullYear(),today.getMonth(),1);
  render();
};
function setCalendarMode(mode){
  if(mode===calendarMode) return;
  if(mode==="month"){
    lastWeekStart=new Date(weekStart);
    monthStart=new Date(weekStart.getFullYear(),weekStart.getMonth(),1);
  }else{
    weekStart=new Date(lastWeekStart);
  }
  calendarMode=mode;
  $("#weekViewBtn").classList.toggle("active",mode==="week");
  $("#monthViewBtn").classList.toggle("active",mode==="month");
  render();
}
$("#weekViewBtn").onclick=()=>setCalendarMode("week");
$("#monthViewBtn").onclick=()=>setCalendarMode("month");
$("#parseBtn").onclick=()=>{
  const text=$("#quickInput").value.trim();
  if(!text){toast("Skriv inn en aktivitet først");return;}
  const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const first=lines[0]||"Ny aktivitet";
  const tm=first.match(/^(.*?)(?:\s+|\s*[-–]\s*)(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
  let title=first,start="10:00",end="11:00";
  if(tm){title=tm[1].trim();start=tm[2].padStart(5,"0");end=tm[3].padStart(5,"0");}
  const loc=lines[1]||"";
  const cat=/\b(vy|jobb|arbeid|vakt|shift|ta|assistent)\b/i.test(title)?"JOBB":/\b(trening|gym|lege|avtale|sosial|privat)\b/i.test(title)?"PERSONAL":/^[A-Z]{2,}\d{4,}/.test(title)?"UNI":"JOBB";
  events.push({id:Date.now(),title,cat,date:iso(calendarMode==="month"?monthStart:weekStart),start,end,loc});
  save();$("#quickInput").value="";render();toast("Aktivitet lagt til");
};
// ---------- .ics import ----------
const icsFile=$("#icsFile");
function openImport(){
  pendingICS=[];
  $("#importStatus").innerHTML="";
  $("#importList").innerHTML="";
  $("#confirmImport").disabled=true;
  $("#importModal").classList.add("open");
}
$("#importBtn").onclick=openImport;
$("#chooseICS").onclick=()=>icsFile.click();
icsFile.onchange=async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  try{
    pendingICS=parseICS(await file.text());
    $("#importModal").classList.add("open");
    $("#importStatus").innerHTML=`<div class="status"><b>${pendingICS.length}</b> aktiviteter funnet i <b>${file.name}</b>. Du kan velge kategori og hvilke aktiviteter som skal importeres.</div>`;
    renderICSList();
  }catch(err){console.error(err);toast("Kunne ikke lese .ics-filen")}
  e.target.value="";
};
function unfoldICS(text){return text.replace(/\r\n[ \t]/g,"").replace(/\n[ \t]/g,"")}
function unescapeICS(v=""){return v.replace(/\\n/gi,"\n").replace(/\\,/g,",").replace(/\\;/g,";").replace(/\\\\/g,"\\").trim()}
function parseICS(text){
 const lines=unfoldICS(text).split(/\r?\n/),out=[];let cur=null;
 for(const raw of lines){
  const line=raw.trim();
  if(line==="BEGIN:VEVENT"){cur={};continue}
  if(line==="END:VEVENT"){
   if(cur&&cur.DTSTART&&cur.SUMMARY){
    const start=parseICSDate(cur.DTSTART),end=parseICSDate(cur.DTEND||cur.DTSTART);
    if(start&&end){
      const finalEnd=cur.DTEND?end:new Date(start.getTime()+3600000);
      out.push({id:Date.now()+Math.random(),uid:cur.UID||null,title:unescapeICS(cur.SUMMARY),cat:inferCategory(cur),date:iso(start),start:timeOnly(start),end:timeOnly(finalEnd),loc:unescapeICS(cur.LOCATION||""),notes:unescapeICS(cur.DESCRIPTION||""),source:"ics",recurring:/FREQ=WEEKLY/i.test(cur.RRULE||"")});
    }
   }
   cur=null;continue
  }
  if(!cur)continue;
  const m=line.match(/^([^:;]+)(?:;[^:]*)?:(.*)$/);if(m)cur[m[1].toUpperCase()]=m[2];
 }
 return out;
}
function parseICSDate(v){
 if(!v)return null;const s=v.trim();
 if(/^\d{8}$/.test(s))return new Date(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8),0,0,0);
 const m=s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);if(!m)return null;
 if(m[7]){const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6]));return new Date(d.getTime()-d.getTimezoneOffset()*60000)}
 return new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6]);
}
function timeOnly(d){return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
function inferCategory(e){
 const hay=[e.SUMMARY,e.CATEGORIES,e.LOCATION,e.DESCRIPTION].filter(Boolean).join(" ").toLowerCase();
 if(/\b(vy|jobb|arbeid|vakt|shift)\b/.test(hay))return "JOBB";
 if(/\b(ta|teaching assistant|studentassistent|assistent)\b/.test(hay))return "JOBB";
 if(/\b(trening|gym|lege|avtale|sosial|privat|personal)\b/.test(hay))return "PERSONAL";
 return "UNI";
}
function renderICSList(){
 const list=$("#importList");
 if(!pendingICS.length){list.innerHTML='<div class="empty">Ingen aktiviteter funnet.</div>';$("#confirmImport").disabled=true;return}
 $("#confirmImport").disabled=false;
 list.innerHTML=pendingICS.map((e,i)=>`
 <label class="import-row">
  <input type="checkbox" data-i="${i}" checked>
  <div><strong>${e.title}</strong><small>${e.date} · ${e.start}–${e.end}${e.loc?" · "+e.loc:""}</small></div>
  <select data-cat="${i}">
   <option value="UNI" ${e.cat==="UNI"?"selected":""}>🎓 Uni</option>
   <option value="JOBB" ${e.cat==="JOBB"?"selected":""}>💼 Jobb</option>
   <option value="PERSONAL" ${e.cat==="PERSONAL"?"selected":""}>🌿 Personal</option>
  </select>
 </label>`).join("");
}
$("#confirmImport").onclick=()=>{
 let selected=[...document.querySelectorAll("#importList input[type=checkbox]:checked")],added=0;
 selected.forEach(cb=>{let i=+cb.dataset.i,e={...pendingICS[i]},sel=document.querySelector(`[data-cat="${i}"]`);e.cat=sel.value;
  const duplicate=events.some(x=>(x.uid&&e.uid&&x.uid===e.uid)||(x.title===e.title&&x.date===e.date&&x.start===e.start&&x.end===e.end));
  if(!duplicate){events.push(e);added++}
 });
 save();$("#importModal").classList.remove("open");pendingICS=[];render();toast(`${added} aktivitet${added===1?"":"er"} importert fra .ics`);
};
function closeImport(){$("#importModal").classList.remove("open");pendingICS=[];$("#importStatus").innerHTML="";$("#importList").innerHTML="";$("#confirmImport").disabled=true}
$("#closeImport").onclick=closeImport;$("#cancelImport").onclick=closeImport;

$("#sidebarHide").onclick=()=>{
 document.body.classList.add("sidebar-hidden");
 localStorage.setItem("luma-sidebar-hidden","1");
};
$("#sidebarRestore").onclick=()=>{
 document.body.classList.remove("sidebar-hidden");
 localStorage.setItem("luma-sidebar-hidden","0");
};
if(localStorage.getItem("luma-sidebar-hidden")==="1")document.body.classList.add("sidebar-hidden");
migrateEvents();
render();
