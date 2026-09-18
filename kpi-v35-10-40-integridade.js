(()=>{
  'use strict';
  const KEYS=['dispKm','dispTempo','cxViagem','cxSemVan','entregas','dropsize','ocupacao','utilizacao'];
  const META={dispKm:.075,dispTempo:.15,cxViagem:254.50,cxSemVan:252.14,entregas:15.36,dropsize:13.72,ocupacao:.77,utilizacao:.6684};
  const PCT=new Set(['dispKm','dispTempo','ocupacao','utilizacao']);
  const lower=new Set(['dispKm','dispTempo']);
  const ok=(key,v)=>lower.has(key)?Number(v)<=META[key]:Number(v)>=META[key];
  const fmt=(key,v)=>v==null||!Number.isFinite(Number(v))?'—':(Number(v)*(PCT.has(key)?100:1)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:false})+(PCT.has(key)?'%':'');
  let imported=[];let watching=false;let scheduled=false;
  const getSaved=()=>{
    try{return JSON.parse(localStorage.getItem('dws_kpi_daily_v5')||localStorage.getItem('dws_kpi_daily_v4')||'[]')||[]}
    catch(e){return []}
  };
  const monthRows=(month)=>{
    const map=new Map(imported.filter(r=>Number(r.date.slice(5,7))===month+1).map(r=>[r.date,r]));
    for(const r of getSaved())if(r&&String(r.date||'').startsWith(`2026-${String(month+1).padStart(2,'0')}-`)){
      if(r.deleted)map.delete(r.date);
      else{const old=map.get(r.date);map.set(r.date,old?{...old,...r,results:{...old.results,...(r.results||{})},bases:{...old.bases,...(r.bases||{})}}:r)}
    }
    return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
  };
  const patch=()=>{
    const sel=document.getElementById('kpi2MonthSelect'),body=document.getElementById('kpi2DailyBody');
    if(!sel||!body||!imported.length)return;
    const mi=Number(sel.value);if(!Number.isInteger(mi)||mi<0||mi>7)return;
    const all=monthRows(mi);let nok=0;
    for(const r of all)for(const key of KEYS){const v=r.results?.[key];if(v!=null&&Number.isFinite(Number(v))&&!ok(key,v))nok++}
    const allMode=document.getElementById('kpi2AllDays')?.classList.contains('active');
    const rows=allMode?all:all.filter(r=>KEYS.some(k=>r.results?.[k]!=null&&Number.isFinite(Number(r.results[k]))&&!ok(k,r.results[k])));
    const dates=[...body.querySelectorAll('tr')].map(tr=>tr.cells?.[0]?.textContent?.trim()).filter(x=>/^\d\d\/\d\d\/2026$/.test(x||''));
    const expected=rows.map(r=>r.date.split('-').reverse().join('/'));
    if(dates.length===expected.length&&dates.every((d,i)=>d===expected[i]))return;
    const missing=body.textContent.includes('Nenhum lançamento')||dates.length<expected.length||body.dataset.kpi40==='1';
    if(!missing)return;
    const counter=document.getElementById('kpi2Count');if(counter)counter.innerHTML=`<b>${nok}</b> NOK`;
    body.dataset.kpi40='1';
    body.innerHTML=rows.length?rows.map(r=>{
      const date=r.date.split('-').reverse().join('/');
      const cells=KEYS.map(key=>{
        const v=r.results?.[key];if(v==null||!Number.isFinite(Number(v)))return '<td class="kpi2-empty">—</td>';
        return ok(key,v)?`<td class="kpi2-good">${fmt(key,v)}</td>`:`<td><button type="button" class="kpi2-badbtn" data-kpi40-action="1">${fmt(key,v)} ↗</button></td>`;
      }).join('');
      return `<tr data-kpi40-date="${r.date}"><td>${date}</td>${cells}<td><button type="button" class="kpi2-edit" data-kpi40-edit="${r.date}">Editar</button></td></tr>`;
    }).join(''):'<tr><td colspan="10" class="kpi2-empty" style="text-align:center;padding:28px">Nenhum lançamento</td></tr>';
  };
  const schedule=()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;patch()},0)};
  document.addEventListener('click',e=>{
    const edit=e.target.closest?.('[data-kpi40-edit]');
    if(edit){if(typeof window.kpi2OpenModal==='function')window.kpi2OpenModal(edit.dataset.kpi40Edit);return}
    if(e.target.closest?.('[data-kpi40-action]')){window.open('https://lead-gestao.gabrielysilva27.workers.dev/#actionPlans','_blank','noopener');return}
    if(e.target.closest?.('#kpi2DailyTab,#kpi2AllDays,#kpi2OnlyNok,#kpi2Save,#kpi2Delete'))schedule();
  });
  document.addEventListener('change',e=>{if(e.target?.id==='kpi2MonthSelect')schedule()});
  (async()=>{
    try{
      const rsp=await fetch('./kpi-v35-10-37-diario-jan-ago.js?v=35-10-40',{cache:'no-store'});
      if(!rsp.ok)throw Error('Arquivo de dados indisponível: '+rsp.status);
      const script=await rsp.text(),match=script.match(/\bconst\s+packed\s*=\s*([\s\S]*?);/);
      if(!match)throw Error('Base compactada não encontrada');
      const b64=[...match[1].matchAll(/'([^']*)'/g)].map(x=>x[1]).join('');
      const bin=atob(b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      const raw=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      const src=JSON.parse(raw);if(src.length!==200)throw Error('A planilha não possui as 200 datas esperadas');
      imported=src.map(([md,tempo,km,semVan,cx,entregas,drop,ocup,prev,real,util])=>({
        date:`2026-${md.slice(0,2)}-${md.slice(2)}`,
        results:{dispKm:km,dispTempo:tempo,cxViagem:cx,cxSemVan:semVan,entregas:real>0?entregas/real:null,dropsize:drop,ocupacao:ocup,utilizacao:util},
        bases:{dispKm:null,dispTempo:null,cxViagem:real,cxSemVan:null,entregas:real,dropsize:entregas,ocupacao:null,utilizacao:prev},seed:true,source:'KPIs Roteirização 2026'
      }));
      if(Array.isArray(window.KPI2_DAILY_SEED)){
        const other=window.KPI2_DAILY_SEED.filter(r=>!/^2026-0[1-8]-/.test(String(r.date||'')));
        window.KPI2_DAILY_SEED.splice(0,window.KPI2_DAILY_SEED.length,...imported,...other);
        try{window.kpi2RenderDaily?.();window.kpi2RenderMonthly?.()}catch(e){console.warn('KPI40 render original:',e)}
      }
      patch();
      if(!watching){const body=document.getElementById('kpi2DailyBody');if(body){watching=true;new MutationObserver(schedule).observe(body,{childList:true})}}
      console.info('KPI40: janeiro a agosto importados, 200 datas, edição local preservada.');
    }catch(e){console.error('KPI40: falha de integridade da base diária',e)}
  })();
})();
