(()=>{
  'use strict';
  const UTIL={"2026-09-01":0.6818181818181818,"2026-09-02":0.7045454545454546,"2026-09-03":0.7954545454545454,"2026-09-04":0.8409090909090909,"2026-09-05":0.6818181818181818,"2026-09-08":0.5909090909090909,"2026-09-09":0.6136363636363636,"2026-09-10":0.6363636363636364,"2026-09-11":0.8181818181818182,"2026-09-12":0.6818181818181818,"2026-09-14":0.5681818181818182,"2026-09-15":0.6590909090909091,"2026-09-16":0.6363636363636364,"2026-09-17":0.6590909090909091,"2026-09-18":0.6818181818181818,"2026-09-19":0.5454545454545454,"2026-09-21":0.5,"2026-09-22":0.6136363636363636,"2026-09-23":0.6818181818181818,"2026-09-24":0.6136363636363636,"2026-09-25":0.8409090909090909,"2026-09-26":0.6818181818181818,"2026-09-28":0.6818181818181818,"2026-09-29":0.7045454545454546,"2026-09-30":0.7727272727272727};
  const MONTH={
    dispKm:{v:.0746,n:35991.599292,d:33493.02},
    dispTempo:{v:.0524,n:209.89825666666667,d:199.44722222222222},
    cxViagem:{v:225.56,n:138492.76,d:614},
    entregas:{v:17.95,n:11019,d:614},
    dropsize:{v:17.86,n:196783.21,d:11019},
    ocupacao:{v:.7052,n:138492.76,d:196392},
    utilizacao:{v:.614,n:614,d:1000}
  };
  const wait=async()=>{for(let i=0;i<180;i++){if(typeof kpi2Records==='function'&&typeof kpi2RenderDaily==='function'&&typeof kpi2RenderMonthly==='function'&&typeof KPI2_DAILY_SEED!=='undefined')return true;await new Promise(r=>setTimeout(r,100))}return false};
  (async()=>{
    if(!(await wait())){console.error('KPI V35.10.44: base KPI não disponível.');return}
    try{
      const official=Object.fromEntries(
        KPI2_DAILY_SEED
          .filter(r=>String(r.date||'').startsWith('2026-09-'))
          .map(r=>[String(r.date),r])
      );
      for(const [date,v] of Object.entries(UTIL)){
        if(official[date]){
          official[date]={
            ...official[date],
            results:{...(official[date].results||{}),utilizacao:v},
            bases:{...(official[date].bases||{}),utilizacao:44},
            seed:true,
            source:'Setembro 2026 oficial'
          };
        }
      }
      const previousRecords=kpi2Records;
      kpi2Records=function(){
        const rows=previousRecords();
        const out=rows.map(r=>{
          const date=String(r.date||'');
          const src=official[date];
          if(!src)return r;
          return {
            ...r,
            ...src,
            results:{...(r.results||{}),...(src.results||{})},
            bases:{...(r.bases||{}),...(src.bases||{})},
            seed:true,
            source:'Setembro 2026 oficial'
          };
        });
        const have=new Set(out.map(r=>String(r.date||'')));
        for(const [date,src] of Object.entries(official)){
          if(!have.has(date))out.push({...src});
        }
        return out.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      };
      kpi2Record=function(date){return kpi2Records().find(r=>String(r.date||'')===String(date))||null};
      kpi2MonthRows=function(mi){
        const p=`2026-${String(mi+1).padStart(2,'0')}-`;
        return kpi2Records().filter(r=>String(r.date||'').startsWith(p));
      };
      if(typeof kpi2MonthMemory==='function'){
        const prevMonthMemory=kpi2MonthMemory;
        kpi2MonthMemory=function(key,mi){
          if(mi===8&&MONTH[key])return {...MONTH[key],complete:true,source:'Setembro 2026 oficial',official:true};
          return prevMonthMemory(key,mi);
        };
      }
      const redraw=()=>{try{kpi2RenderDaily();kpi2RenderMonthly()}catch(e){console.warn('KPI44 redraw',e)}};
      redraw();
      setTimeout(redraw,250);
      setTimeout(redraw,800);
      setTimeout(redraw,1800);
      document.addEventListener('change',e=>{if(e.target?.id==='kpi2MonthSelect')setTimeout(redraw,0)});
      document.addEventListener('click',e=>{
        if(e.target?.closest?.('#kpi2DailyTab,#kpi2AllDays,#kpi2OnlyNok'))setTimeout(redraw,0);
      });
      console.info('KPI V35.10.44 ativo: setembro oficial prevalece sobre cache/localStorage.');
    }catch(e){console.error('Falha KPI V35.10.44',e)}
  })();
})();