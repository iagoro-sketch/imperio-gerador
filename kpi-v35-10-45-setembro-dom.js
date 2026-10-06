(()=>{
'use strict';
const UTIL={
"2026-09-01":0.6818181818181818,"2026-09-02":0.7045454545454546,"2026-09-03":0.7954545454545454,
"2026-09-04":0.8409090909090909,"2026-09-05":0.6818181818181818,"2026-09-08":0.5909090909090909,
"2026-09-09":0.6136363636363636,"2026-09-10":0.6363636363636364,"2026-09-11":0.8181818181818182,
"2026-09-12":0.6818181818181818,"2026-09-14":0.5681818181818182,"2026-09-15":0.6590909090909091,
"2026-09-16":0.6363636363636364,"2026-09-17":0.6590909090909091,"2026-09-18":0.6818181818181818,
"2026-09-19":0.5454545454545454,"2026-09-21":0.5,"2026-09-22":0.6136363636363636,
"2026-09-23":0.6818181818181818,"2026-09-24":0.6136363636363636,"2026-09-25":0.8409090909090909,
"2026-09-26":0.6818181818181818,"2026-09-28":0.6818181818181818,"2026-09-29":0.7045454545454546,
"2026-09-30":0.7727272727272727
};
const KEYS=['dispKm','dispTempo','cxViagem','cxSemVan','entregas','dropsize','ocupacao','utilizacao'];
const META={dispKm:.075,dispTempo:.15,cxViagem:254.50,cxSemVan:252.14,entregas:15.36,dropsize:13.72,ocupacao:.77,utilizacao:.6684};
const PCT=new Set(['dispKm','dispTempo','ocupacao','utilizacao']);
const lower=new Set(['dispKm','dispTempo']);
const ok=(k,v)=>lower.has(k)?Number(v)<=META[k]:Number(v)>=META[k];
const fmt=(k,v)=>{
  if(v==null||!Number.isFinite(Number(v)))return '—';
  const n=Number(v)*(PCT.has(k)?100:1);
  return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:false})+(PCT.has(k)?'%':'');
};
let SEP=[];
let busy=false;
async function load(){
  try{
    const r=await fetch('./kpi-v35-10-42-setembro-completo.js?v=35-10-45',{cache:'no-store'});
    if(!r.ok)throw Error('base setembro '+r.status);
    const s=await r.text();
    const m=s.match(/const\s+SEP\s*=\s*(\[[\s\S]*?\]);\s*\n\s*const\s+BYDATE/);
    if(!m)throw Error('SEP não encontrado');
    SEP=JSON.parse(m[1]).map(r=>({
      ...r,
      results:{...(r.results||{}),utilizacao:UTIL[r.date]??r.results?.utilizacao},
      bases:{...(r.bases||{}),utilizacao:44}
    }));
    force();
  }catch(e){console.error('KPI45 load',e)}
}
function isSeptember(){
  const sel=document.getElementById('kpi2MonthSelect');
  return sel && Number(sel.value)===8;
}
function render(){
  if(!SEP.length||!isSeptember())return;
  const body=document.getElementById('kpi2DailyBody'); if(!body)return;
  const allMode=document.getElementById('kpi2AllDays')?.classList.contains('active');
  const rows=allMode?SEP:SEP.filter(r=>KEYS.some(k=>{
    const v=r.results?.[k]; return v!=null&&Number.isFinite(Number(v))&&!ok(k,v);
  }));
  const nokDays=SEP.filter(r=>KEYS.some(k=>{
    const v=r.results?.[k]; return v!=null&&Number.isFinite(Number(v))&&!ok(k,v);
  })).length;
  const counter=document.getElementById('kpi2Count');
  if(counter)counter.innerHTML='<b>'+nokDays+'</b> NOK';
  const html=rows.map(r=>{
    const date=r.date.split('-').reverse().join('/');
    const cells=KEYS.map(k=>{
      const v=r.results?.[k];
      if(v==null||!Number.isFinite(Number(v)))return '<td class="kpi2-empty">—</td>';
      if(ok(k,v))return '<td class="kpi2-good">'+fmt(k,v)+'</td>';
      return '<td><button type="button" class="kpi2-badbtn" data-kpi45-action="1">'+fmt(k,v)+' ↗</button></td>';
    }).join('');
    return '<tr data-kpi45-date="'+r.date+'"><td>'+date+'</td>'+cells+'<td><button type="button" class="kpi2-edit" data-kpi45-edit="'+r.date+'">Editar</button></td></tr>';
  }).join('');
  const target=html||'<tr><td colspan="10" class="kpi2-empty" style="text-align:center;padding:28px">Nenhum lançamento</td></tr>';
  if(body.innerHTML!==target){
    busy=true; body.innerHTML=target; body.dataset.kpi45='1'; busy=false;
  }
}
function force(){
  render();
  setTimeout(render,100);setTimeout(render,350);setTimeout(render,900);setTimeout(render,1800);
}
document.addEventListener('click',e=>{
  const edit=e.target.closest?.('[data-kpi45-edit]');
  if(edit){ if(typeof window.kpi2OpenModal==='function')window.kpi2OpenModal(edit.dataset.kpi45Edit); return; }
  if(e.target.closest?.('[data-kpi45-action]')){
    window.open('https://lead-gestao.gabrielysilva27.workers.dev/#actionPlans','_blank','noopener'); return;
  }
  if(e.target.closest?.('#kpi2DailyTab,#kpi2AllDays,#kpi2OnlyNok'))setTimeout(force,0);
});
document.addEventListener('change',e=>{if(e.target?.id==='kpi2MonthSelect')setTimeout(force,0)});
const watch=()=>{
  const body=document.getElementById('kpi2DailyBody');
  if(!body){setTimeout(watch,250);return}
  new MutationObserver(()=>{if(!busy&&isSeptember())setTimeout(render,0)}).observe(body,{childList:true,subtree:false});
};
load();watch();
console.info('KPI V35.10.45 ativo: tabela de setembro renderizada pela base oficial.');
})();