(()=>{
  const UTIL={"2026-09-01":0.6818181818181818,"2026-09-02":0.7045454545454546,"2026-09-03":0.7954545454545454,"2026-09-04":0.8409090909090909,"2026-09-05":0.6818181818181818,"2026-09-08":0.5909090909090909,"2026-09-09":0.6136363636363636,"2026-09-10":0.6363636363636364,"2026-09-11":0.8181818181818182,"2026-09-12":0.6818181818181818,"2026-09-14":0.5681818181818182,"2026-09-15":0.6590909090909091,"2026-09-16":0.6363636363636364,"2026-09-17":0.6590909090909091,"2026-09-18":0.6818181818181818,"2026-09-19":0.5454545454545454,"2026-09-21":0.5,"2026-09-22":0.6136363636363636,"2026-09-23":0.6818181818181818,"2026-09-24":0.6136363636363636,"2026-09-25":0.8409090909090909,"2026-09-26":0.6818181818181818,"2026-09-28":0.6818181818181818,"2026-09-29":0.7045454545454546,"2026-09-30":0.7727272727272727};
  const MONTH={v:.614,n:614,d:1000,complete:true,source:'Gestão da Utilização Setembro',official:true};
  const wait=async()=>{for(let i=0;i<180;i++){if(typeof kpi2Records==='function'&&typeof kpi2RenderDaily==='function'&&typeof kpi2RenderMonthly==='function'&&typeof kpi2MonthMemory==='function')return true;await new Promise(r=>setTimeout(r,100))}return false};
  (async()=>{
    if(!(await wait())){console.error('KPI V35.10.43: base KPI não disponível.');return}
    try{
      const previousRecords=kpi2Records;
      kpi2Records=function(){
        return previousRecords().map(r=>{
          const date=String(r.date||'');
          if(!(date in UTIL))return r;
          const source=String(r.source||'');
          const manual=!r.seed && source && !/KPI 2026|Dispersão|Setembro 2026 atualizado|Gestão da Utilização Setembro/i.test(source);
          if(manual)return r;
          return {...r,
            results:{...(r.results||{}),utilizacao:UTIL[date]},
            bases:{...(r.bases||{}),utilizacao:44},
            source:'Setembro 2026 atualizado • Utilização: Gestão da Utilização'
          };
        });
      };
      kpi2Record=function(date){return kpi2Records().find(r=>String(r.date||'')===String(date))||null};
      kpi2MonthRows=function(mi){const p=`2026-${String(mi+1).padStart(2,'0')}-`;return kpi2Records().filter(r=>String(r.date||'').startsWith(p))};
      const previousMonthMemory=kpi2MonthMemory;
      kpi2MonthMemory=function(key,mi){
        if(mi===8&&key==='utilizacao'){
          let hasSaved=false;
          try{hasSaved=typeof kpi2LoadSaved==='function'&&kpi2LoadSaved().some(r=>!r.deleted&&String(r.date||'').startsWith('2026-09-'))}catch(e){}
          if(!hasSaved)return {...MONTH};
        }
        return previousMonthMemory(key,mi);
      };
      kpi2RenderDaily();kpi2RenderMonthly();
      setTimeout(()=>{try{kpi2RenderDaily();kpi2RenderMonthly()}catch(e){}},400);
      setTimeout(()=>{try{kpi2RenderDaily();kpi2RenderMonthly()}catch(e){}},1200);
      console.info('KPI V35.10.43 ativo: Utilização de setembro corrigida pela base Gestão da Utilização; demais KPIs preservados.');
    }catch(e){console.error('Falha KPI V35.10.43',e)}
  })();
})();