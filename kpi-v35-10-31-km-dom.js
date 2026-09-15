(()=>{
  const KM={
    '01/09/2026':{v:-0.07506309984412962,b:1263.87},
    '02/09/2026':{v: 0.07008211537468378,b:968.15},
    '03/09/2026':{v:-0.08721814711097764,b:1032.01},
    '04/09/2026':{v: 0.6106849664676939,b:1410.58},
    '05/09/2026':{v: 0.05151598930974122,b:1085.10},
    '08/09/2026':{v: 0.41815273137909936,b:1062.65},
    '09/09/2026':{v:-0.030419809773696405,b:975.68},
    '10/09/2026':{v:-0.021098833403919492,b:1038.92},
    '11/09/2026':{v: 0.020305543111566182,b:1093.79},
    '12/09/2026':{v:-0.029808634703151315,b:1010.11}
  };
  const TEMPO={
    '01/09/2026':{v: 0.11068352574674778,b:7.579166666666665},
    '02/09/2026':{v: 0.19629592948400565,b:7.011805555555554},
    '03/09/2026':{v:-0.07306658231851959,b:8.781944444444443},
    '04/09/2026':{v: 0.09414741759667788,b:10.70277777777778},
    '05/09/2026':{v:-0.013359114079802947,b:7.901388888888887},
    '08/09/2026':{v: 0.026373373258090638,b:6.029861111111109},
    '09/09/2026':{v: 0.10799712555179153,b:6.764583333333333},
    '10/09/2026':{v:-0.00621632822213003,b:6.7027777777777775},
    '11/09/2026':{v: 0.21746703159990055,b:8.372916666666667},
    '12/09/2026':{v:-0.0011503869483372453,b:6.6402777777777775}
  };
  const META_KM=.075, META_TEMPO=.15;
  const MONTH_KM=.1083, MONTH_TEMPO=0.06715875869332333;
  const fmt=v=>(v*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:false})+'%';

  function renderCell(cell,v,meta,tag){
    const good=v<=meta;
    const desired=good
      ? `<span class="kpi2-good">${fmt(v)}</span>`
      : `<button class="kpi2-badbtn" type="button" onclick="window.open('https://lead-gestao.gabrielysilva27.workers.dev/#actionPlans','_blank','noopener')">${fmt(v)} ↗</button>`;
    if(cell.dataset[tag]!==String(v)){
      cell.className=good?'kpi2-good':'';
      cell.innerHTML=desired;
      cell.dataset[tag]=String(v);
    }
  }

  function patchDaily(){
    const body=document.getElementById('kpi2DailyBody');
    if(!body)return;
    for(const tr of [...body.querySelectorAll('tr')]){
      const tds=tr.querySelectorAll('td');
      if(tds.length<3)continue;
      const date=(tds[0].textContent||'').trim();
      if(KM[date])renderCell(tds[1],KM[date].v,META_KM,'km32');
      if(TEMPO[date])renderCell(tds[2],TEMPO[date].v,META_TEMPO,'tempo32');
    }
  }

  function patchMonthly(){
    const table=document.querySelector('#kpi2MonthlyPane .kpi2-table');
    if(!table)return;
    const headers=[...table.querySelectorAll('thead th')].map(x=>(x.textContent||'').trim().toLowerCase());
    const setIdx=headers.findIndex(x=>x==='set'||x==='setembro');
    if(setIdx<0)return;
    for(const tr of table.querySelectorAll('tbody tr')){
      const cells=tr.querySelectorAll('td');
      if(!cells.length)continue;
      const label=(cells[0].textContent||'').trim().toLowerCase();
      let v=null,meta=null;
      if(label==='dispersão km'||label==='dispersao km'){v=MONTH_KM;meta=META_KM}
      if(label==='dispersão de tempo'||label==='dispersao de tempo'||label==='dispersão tempo'||label==='dispersao tempo'){v=MONTH_TEMPO;meta=META_TEMPO}
      if(v===null)continue;
      const cell=cells[setIdx];
      if(!cell)continue;
      cell.className=v<=meta?'kpi2-good':'kpi2-bad';
      cell.textContent=fmt(v);
    }
  }

  function applyDataMemory(){
    if(window.__KPI32_DATA_PATCHED__||typeof kpi2Records!=='function')return;
    window.__KPI32_DATA_PATCHED__=true;
    const iso=d=>{const [dd,mm,yy]=d.split('/');return `${yy}-${mm}-${dd}`};
    const byIso={};
    for(const [d,x] of Object.entries(KM)){const k=iso(d);byIso[k]=byIso[k]||{};byIso[k].km=x}
    for(const [d,x] of Object.entries(TEMPO)){const k=iso(d);byIso[k]=byIso[k]||{};byIso[k].tempo=x}
    const prev=kpi2Records;
    kpi2Records=function(){
      const rows=prev().map(r=>{
        const x=byIso[String(r.date||'')];
        if(!x)return r;
        const results={...(r.results||{})},bases={...(r.bases||{})};
        if(x.km){results.dispKm=x.km.v;bases.dispKm=x.km.b}
        if(x.tempo){results.dispTempo=x.tempo.v;bases.dispTempo=x.tempo.b}
        return {...r,results,bases,source:'Dispersão Setembro'};
      });
      const have=new Set(rows.map(r=>String(r.date||'')));
      for(const [date,x] of Object.entries(byIso))if(!have.has(date)){
        const results={},bases={};
        if(x.km){results.dispKm=x.km.v;bases.dispKm=x.km.b}
        if(x.tempo){results.dispTempo=x.tempo.v;bases.dispTempo=x.tempo.b}
        rows.push({date,results,bases,seed:true,source:'Dispersão Setembro'});
      }
      return rows.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    };
    if(typeof kpi2MonthRows==='function')kpi2MonthRows=function(mi){const p=`2026-${String(mi+1).padStart(2,'0')}-`;return kpi2Records().filter(r=>String(r.date||'').startsWith(p))};
  }

  function run(){applyDataMemory();patchDaily();patchMonthly()}
  setInterval(run,350);
  document.addEventListener('click',()=>setTimeout(run,0),true);
  document.addEventListener('change',()=>setTimeout(run,0),true);
  setTimeout(run,50);setTimeout(run,500);setTimeout(run,1500);
  console.info('KPI V35.10.32 ativo: Dispersão KM e Dispersão de Tempo de setembro atualizadas no dia a dia e memória.');
})();