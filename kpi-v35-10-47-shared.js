(()=>{
  'use strict';
  const VERSION='35.10.47';
  const API='/api/kpi';
  const PRIMARY='dws_kpi_daily_v5';
  const LEGACY='dws_kpi_daily_v4';
  const SHARED_CACHE='dws_kpi_shared_cache_v1';
  let shared=[];
  let installed=false;
  let syncing=false;

  const clone=x=>JSON.parse(JSON.stringify(x||[]));
  const sig=x=>JSON.stringify((x||[]).map(r=>[r?.date,r?.deleted,r?.results,r?.bases,r?.source]));

  function readLocal(){
    try{
      const x=JSON.parse(localStorage.getItem(PRIMARY)||localStorage.getItem(LEGACY)||'[]');
      return Array.isArray(x)?x:[];
    }catch(e){return []}
  }

  function mirror(records){
    const data=clone(records);
    try{
      localStorage.setItem(PRIMARY,JSON.stringify(data));
      localStorage.setItem(SHARED_CACHE,JSON.stringify(data));
    }catch(e){}
  }

  async function apiGet(){
    const r=await fetch(API,{cache:'no-store',headers:{'accept':'application/json'}});
    if(!r.ok)throw new Error('KPI compartilhado indisponível: '+r.status);
    const j=await r.json();
    if(!j?.ok||!Array.isArray(j.records))throw new Error(j?.error||'Resposta inválida do KPI compartilhado.');
    return j.records;
  }

  async function apiPost(changes){
    if(!changes.length)return shared;
    const r=await fetch(API,{
      method:'POST',
      headers:{'content-type':'application/json','accept':'application/json'},
      body:JSON.stringify({changes})
    });
    if(!r.ok)throw new Error('Falha ao salvar KPI compartilhado: '+r.status);
    const j=await r.json();
    if(!j?.ok||!Array.isArray(j.records))throw new Error(j?.error||'Falha ao confirmar gravação.');
    return j.records;
  }

  function renderAll(){
    try{window.kpi2RenderDaily?.()}catch(e){}
    try{window.kpi2RenderMonthly?.()}catch(e){}
  }

  function diff(oldRows,newRows){
    const a=new Map((oldRows||[]).filter(Boolean).map(r=>[String(r.date||''),r]));
    const b=new Map((newRows||[]).filter(Boolean).map(r=>[String(r.date||''),r]));
    const out=[];
    for(const [date,row] of b){
      if(!date)continue;
      if(JSON.stringify(a.get(date)||null)!==JSON.stringify(row))out.push(row);
    }
    for(const [date,row] of a){
      if(date&&!b.has(date))out.push({...row,date,deleted:true});
    }
    return out;
  }

  async function refreshRemote(force=false){
    if(syncing)return;
    syncing=true;
    try{
      const remote=await apiGet();
      if(force||sig(remote)!==sig(shared)){
        shared=clone(remote);
        mirror(shared);
        renderAll();
      }
      document.documentElement.dataset.kpiShared='ok';
    }catch(e){
      console.error('KPI compartilhado:',e);
      document.documentElement.dataset.kpiShared='offline';
    }finally{syncing=false}
  }

  async function bootstrap(){
    for(let i=0;i<180;i++){
      if(typeof window.kpi2LoadSaved==='function'&&typeof window.kpi2SaveSaved==='function')break;
      await new Promise(r=>setTimeout(r,100));
    }
    if(typeof window.kpi2LoadSaved!=='function'||typeof window.kpi2SaveSaved!=='function'){
      console.error('KPI compartilhado: funções KPI não disponíveis.');
      return;
    }

    let remote=[];
    try{remote=await apiGet()}catch(e){console.error(e)}

    // Migra somente lançamentos locais de outubro/2026 em diante.
    // Evita levar para o servidor edições antigas de Jan-Set que já foram substituídas pela base oficial.
    const localFuture=readLocal().filter(r=>{
      const d=String(r?.date||'');
      return /^\d{4}-\d{2}-\d{2}$/.test(d)&&d>='2026-10-01';
    });

    if(!remote.length&&localFuture.length){
      try{remote=await apiPost(localFuture)}catch(e){console.error('Migração KPI:',e)}
    }

    shared=clone(remote);
    mirror(shared);

    const originalSave=window.kpi2SaveSaved;
    window.kpi2LoadSaved=kpi2LoadSaved=function(){return clone(shared)};

    window.kpi2SaveSaved=kpi2SaveSaved=function(rows){
      const next=Array.isArray(rows)?clone(rows):[];
      const changes=diff(shared,next);
      shared=next;
      mirror(shared);
      renderAll();
      if(changes.length){
        apiPost(changes).then(records=>{
          shared=clone(records);
          mirror(shared);
          renderAll();
          document.documentElement.dataset.kpiShared='ok';
        }).catch(e=>{
          console.error('KPI compartilhado: erro ao salvar',e);
          document.documentElement.dataset.kpiShared='offline';
          try{originalSave(next)}catch(_){}
        });
      }
    };

    installed=true;
    renderAll();
    document.documentElement.dataset.kpiShared='ok';

    setInterval(()=>{if(!document.hidden)refreshRemote(false)},10000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshRemote(true)});
    window.addEventListener('focus',()=>refreshRemote(true));
    console.info('KPI V'+VERSION+': gravação compartilhada ativa entre dispositivos.');
  }

  bootstrap();
})();