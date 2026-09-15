(()=>{
  const KM28={
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
  const wait=async()=>{
    for(let i=0;i<120;i++){
      if(typeof kpi2Records==='function'&&typeof kpi2RenderDaily==='function'&&typeof kpi2RenderMonthly==='function'&&typeof KPI2_DAILY_SEED!=='undefined')return true;
      await new Promise(r=>setTimeout(r,100));
    }
    return false;
  };
  (async()=>{
    if(!(await wait())){console.error('KPI V35.10.28: base de KPI não disponível.');return}
    try{
      // Atualiza a base histórica carregada.
      for(const r of KPI2_DAILY_SEED){
        const x=KM28[String(r.date||'')];
        if(!x)continue;
        r.results=r.results||{};r.bases=r.bases||{};
        r.results.dispKm=x.v;r.bases.dispKm=x.b;
        r.source='Dispersão KM Setembro';
      }
      // Garante que o valor oficial da planilha prevaleça também sobre históricos locais antigos.
      const baseRecords=kpi2Records;
      kpi2Records=function(){
        const rows=baseRecords().map(r=>{
          const x=KM28[String(r.date||'')];
          if(!x)return r;
          return {...r,results:{...(r.results||{}),dispKm:x.v},bases:{...(r.bases||{}),dispKm:x.b},source:'Dispersão KM Setembro'};
        });
        const have=new Set(rows.map(r=>String(r.date||'')));
        for(const [date,x] of Object.entries(KM28))if(!have.has(date))rows.push({date,results:{dispKm:x.v},bases:{dispKm:x.b},seed:true,source:'Dispersão KM Setembro'});
        rows.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
        return rows;
      };
      kpi2RenderDaily();
      kpi2RenderMonthly();
      console.info('KPI V35.10.28 ativo: Dispersão KM diária de setembro atualizada até 12/09. Acumulado Set: 10,83%.');
    }catch(e){console.error('Falha KPI V35.10.28',e)}
  })();
})();