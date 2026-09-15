(()=>{
  const UI_KEY='dws_ui_state_v1';
  const AUTH_KEY='dws_auth_keep_v1';
  const AUTH_TTL=12*60*60*1000;

  const readState=()=>{
    try{return JSON.parse(localStorage.getItem(UI_KEY)||'{}')||{}}catch{return{}}
  };
  const writeState=(patch={})=>{
    try{
      const cur=readState();
      localStorage.setItem(UI_KEY,JSON.stringify({...cur,...patch,ts:Date.now()}));
    }catch(e){}
  };
  const currentView=()=>document.querySelector('.view.active')?.id||'dashboard';
  const currentKpiMode=()=>document.getElementById('kpi2DailyPane')?.classList.contains('active')?'daily':'monthly';
  const currentKpiFilter=()=>document.getElementById('kpi2AllDays')?.classList.contains('active')?'all':'nok';
  const saveUi=()=>writeState({
    view:currentView(),
    kpiMode:currentKpiMode(),
    kpiMonth:document.getElementById('kpi2MonthSelect')?.value??null,
    kpiFilter:currentKpiFilter(),
    scrollY:Math.max(0,Math.round(window.scrollY||0))
  });

  function keepAuth(){
    try{localStorage.setItem(AUTH_KEY,String(Date.now()))}catch(e){}
  }
  function clearAuth(){
    try{localStorage.removeItem(AUTH_KEY)}catch(e){}
  }
  function validSavedAuth(){
    try{
      const t=Number(localStorage.getItem(AUTH_KEY)||0);
      return t>0 && Date.now()-t<AUTH_TTL;
    }catch{return false}
  }

  // Mantém a sessão em F5/reabertura da aba durante o turno, sem guardar senha.
  try{
    if(sessionStorage.getItem('dws_auth_v34')==='1')keepAuth();
    else if(validSavedAuth()){
      sessionStorage.setItem('dws_auth_v34','1');
      if(typeof window.dwsShowApp==='function')window.dwsShowApp();
      else{
        document.body.classList.remove('auth-locked');
        document.getElementById('loginGate')?.classList.add('hidden');
        const out=document.getElementById('logoutBtn');if(out)out.style.display='block';
      }
    }
  }catch(e){}

  const gate=document.getElementById('loginGate');
  if(gate){
    new MutationObserver(()=>{
      if(gate.classList.contains('hidden') && sessionStorage.getItem('dws_auth_v34')==='1')keepAuth();
    }).observe(gate,{attributes:true,attributeFilter:['class']});
  }
  document.getElementById('logoutBtn')?.addEventListener('click',clearAuth,true);

  // Guarda a seção atual antes da navegação e sempre que os filtros de KPI mudarem.
  document.addEventListener('click',e=>{
    const nav=e.target.closest?.('.nav button[data-view]');
    if(nav)writeState({view:nav.dataset.view,scrollY:0});
    if(e.target.closest?.('#kpi2MonthlyTab'))writeState({view:'kpis',kpiMode:'monthly',scrollY:0});
    if(e.target.closest?.('#kpi2DailyTab'))writeState({view:'kpis',kpiMode:'daily',scrollY:0});
    if(e.target.closest?.('#kpi2OnlyNok'))writeState({view:'kpis',kpiFilter:'nok'});
    if(e.target.closest?.('#kpi2AllDays'))writeState({view:'kpis',kpiFilter:'all'});
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.id==='kpi2MonthSelect')writeState({view:'kpis',kpiMonth:e.target.value});
  },true);
  window.addEventListener('beforeunload',saveUi);
  let scrollTimer=null;
  window.addEventListener('scroll',()=>{
    clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>writeState({scrollY:Math.max(0,Math.round(window.scrollY||0))}),180);
  },{passive:true});

  function restore(){
    const st=readState();
    const view=st.view;
    if(view && document.getElementById(view) && typeof window.go==='function'){
      try{window.go(view)}catch(e){}
    }
    if(view==='kpis'){
      const month=document.getElementById('kpi2MonthSelect');
      if(month && st.kpiMonth!=null && [...month.options].some(o=>o.value===String(st.kpiMonth))){
        month.value=String(st.kpiMonth);
        month.dispatchEvent(new Event('change',{bubbles:true}));
      }
      if(st.kpiMode==='daily')document.getElementById('kpi2DailyTab')?.click();
      else if(st.kpiMode==='monthly')document.getElementById('kpi2MonthlyTab')?.click();
      if(st.kpiFilter==='all')document.getElementById('kpi2AllDays')?.click();
      else if(st.kpiFilter==='nok')document.getElementById('kpi2OnlyNok')?.click();
    }
    setTimeout(()=>window.scrollTo({top:Number(st.scrollY)||0,left:0,behavior:'auto'}),120);
  }

  // Duas passagens: a segunda pega módulos carregados de forma assíncrona.
  setTimeout(restore,250);
  setTimeout(restore,1400);
  setTimeout(()=>{
    const b=document.querySelector('.sidebox b');
    if(b)b.textContent=b.textContent.replace(/V\d+(?:\.\d+)+/,'V35.10.33');
  },500);
  console.info('Painel V35.10.33: posição, KPI e sessão persistentes em recargas.');
})();