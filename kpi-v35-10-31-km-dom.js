(()=>{
  const KM={
    '01/09/2026':-0.07506309984412962,
    '02/09/2026': 0.07008211537468378,
    '03/09/2026':-0.08721814711097764,
    '04/09/2026': 0.6106849664676939,
    '05/09/2026': 0.05151598930974122,
    '08/09/2026': 0.41815273137909936,
    '09/09/2026':-0.030419809773696405,
    '10/09/2026':-0.021098833403919492,
    '11/09/2026': 0.020305543111566182,
    '12/09/2026':-0.029808634703151315
  };
  const META=.075;
  const fmt=v=>(v*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:false})+'%';
  function patchDaily(){
    const body=document.getElementById('kpi2DailyBody');
    if(!body)return;
    for(const tr of [...body.querySelectorAll('tr')]){
      const tds=tr.querySelectorAll('td');
      if(tds.length<2)continue;
      const date=(tds[0].textContent||'').trim();
      if(!(date in KM))continue;
      const v=KM[date],cell=tds[1],good=v<=META;
      const desired=good
        ? `<span class="kpi2-good">${fmt(v)}</span>`
        : `<button class="kpi2-badbtn" type="button" onclick="window.open('https://lead-gestao.gabrielysilva27.workers.dev/#actionPlans','_blank','noopener')">${fmt(v)} ↗</button>`;
      if(cell.dataset.km31!==String(v)){
        cell.className=good?'kpi2-good':'';
        cell.innerHTML=desired;
        cell.dataset.km31=String(v);
      }
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
      if(label!=='dispersão km'&&label!=='dispersao km')continue;
      const cell=cells[setIdx];
      if(!cell)continue;
      const v=.1083;
      cell.className=v<=META?'kpi2-good':'kpi2-bad';
      cell.textContent=fmt(v);
      cell.dataset.km31='monthly';
    }
  }
  function run(){patchDaily();patchMonthly()}
  setInterval(run,350);
  document.addEventListener('click',()=>setTimeout(run,0),true);
  document.addEventListener('change',()=>setTimeout(run,0),true);
  setTimeout(run,50);setTimeout(run,500);setTimeout(run,1500);
  console.info('KPI V35.10.31 ativo: correção direta da Dispersão KM de setembro.');
})();