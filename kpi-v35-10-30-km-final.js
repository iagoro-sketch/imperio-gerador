(()=>{
  const KM30={
    '2026-09-01':{v:-0.07506309984412962,b:1263.87},
    '2026-09-02':{v:0.07008211537468378,b:968.15},
    '2026-09-03':{v:-0.08721814711097764,b:1032.01},
    '2026-09-04':{v:0.6106849664676939,b:1410.58},
    '2026-09-05':{v:0.05151598930974122,b:1085.10},
    '2026-09-08':{v:0.41815273137909936,b:1062.65},
    '2026-09-09':{v:-0.030419809773696405,b:975.68},
    '2026-09-10':{v:-0.021098833403919492,b:1038.92},
    '2026-09-11':{v:0.020305543111566182,b:1093.79},
    '2026-09-12':{v:-0.029808634703151315,b:1010.11}
  };
  const overlayKm=(rows)=>{
    const out=(rows||[]).map(r=>{
      const x=KM30[String(r.date||'')];
      if(!x)return r;
      return {...r,results:{...(r.results||{}),dispKm:x.v},bases:{...(r.bases||{}),dispKm:x.b},source:'Dispersão KM Setembro'};
    });
    const have=new Set(out.map(r=>String(r.date||'')));
    for(const [date,x] of Object.entries(KM30)){
      if(!have.has(date))out.push({date,results:{dispKm:x.v},bases:{dispKm:x.b},seed:true,source:'Dispersão KM Setembro'});
    }
    return out.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  };
  (async()=>{
    for(let i=0;i<200;i++){
      if(typeof kpi27OpenValidation==='function'&&typeof kpi2Records==='function'&&typeof kpi2RenderDaily==='function'&&typeof kpi2RenderMonthly==='function')break;
      await new Promise(r=>setTimeout(r,100));
    }
    if(typeof kpi27OpenValidation!=='function'||typeof kpi2Records!=='function'){
      console.error('KPI V35.10.30: histórico V35.10.27 não concluiu a carga.');return;
    }
    try{
      if(typeof KPI2_DAILY_SEED!=='undefined'){
        for(const r of KPI2_DAILY_SEED){
          const x=KM30[String(r.date||'')];
          if(!x)continue;
          r.results=r.results||{};r.bases=r.bases||{};
          r.results.dispKm=x.v;r.bases.dispKm=x.b;r.source='Dispersão KM Setembro';
        }
      }
      const recordsBeforeKm30=kpi2Records;
      kpi2Records=function(){return overlayKm(recordsBeforeKm30())};
      kpi2Record=function(date){return kpi2Records().find(r=>String(r.date||'')===String(date))||null};
      kpi2MonthRows=function(mi){const pref=`2026-${String(mi+1).padStart(2,'0')}-`;return kpi2Records().filter(r=>String(r.date||'').startsWith(pref))};
      kpi2DailyMemory=function(key,mi){
        const rows=kpi2MonthRows(mi).filter(r=>Number.isFinite(Number(r.results?.[key])));
        if(!rows.length)return null;
        const vals=rows.map(r=>Number(r.results[key]));let n=0,d=0,missing=0;
        for(const r of rows){const v=Number(r.results[key]),base=Number(r.bases?.[key]);if(!(base>0)){missing++;continue}d+=base;n+=(key==='dispKm'||key==='dispTempo')?(1+v)*base:v*base}
        if(!missing&&d>0)return {v:(key==='dispKm'||key==='dispTempo')?n/d-1:n/d,n,d,complete:true,source:'Memória diária',days:rows.length,missing:0};
        return {v:vals.length?vals.reduce((s,v)=>s+v,0)/vals.length:null,n:null,d:null,complete:false,source:'Resultado diário provisório',days:rows.length,missing};
      };
      kpi2RenderDaily();kpi2RenderMonthly();
      setTimeout(()=>{try{kpi2RenderDaily();kpi2RenderMonthly()}catch(e){}},800);
      console.info('KPI V35.10.30 ativo: KM diário de setembro aplicado após a carga completa do histórico.');
    }catch(e){console.error('Falha KPI V35.10.30',e)}
  })();
})();