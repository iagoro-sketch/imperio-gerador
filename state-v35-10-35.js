(()=>{
  const UI_KEY='dws_ui_state_v1';
  const OLD_AUTH_KEY='dws_auth_keep_v1';
  try{localStorage.removeItem(OLD_AUTH_KEY)}catch(e){}

  const readState=()=>{try{return JSON.parse(localStorage.getItem(UI_KEY)||'{}')||{}}catch{return{}}};
  const writeState=(patch={})=>{try{localStorage.setItem(UI_KEY,JSON.stringify({...readState(),...patch,ts:Date.now()}))}catch(e){}};
  const currentView=()=>document.querySelector('.view.active')?.id||'dashboard';
  const currentKpiMode=()=>document.getElementById('kpi2DailyPane')?.classList.contains('active')?'daily':'monthly';
  const currentKpiFilter=()=>document.getElementById('kpi2AllDays')?.classList.contains('active')?'all':'nok';
  const saveUi=()=>writeState({view:currentView(),kpiMode:currentKpiMode(),kpiMonth:document.getElementById('kpi2MonthSelect')?.value??null,kpiFilter:currentKpiFilter(),scrollY:Math.max(0,Math.round(window.scrollY||0))});

  // Autenticação fica somente na sessão atual: F5 mantém, fechar o navegador encerra.
  document.getElementById('logoutBtn')?.addEventListener('click',()=>{try{sessionStorage.removeItem('dws_auth_v34')}catch(e){}},true);

  document.addEventListener('click',e=>{
    const nav=e.target.closest?.('.nav button[data-view]');if(nav)writeState({view:nav.dataset.view,scrollY:0});
    if(e.target.closest?.('#kpi2MonthlyTab'))writeState({view:'kpis',kpiMode:'monthly',scrollY:0});
    if(e.target.closest?.('#kpi2DailyTab'))writeState({view:'kpis',kpiMode:'daily',scrollY:0});
    if(e.target.closest?.('#kpi2OnlyNok'))writeState({view:'kpis',kpiFilter:'nok'});
    if(e.target.closest?.('#kpi2AllDays'))writeState({view:'kpis',kpiFilter:'all'});
  },true);
  document.addEventListener('change',e=>{if(e.target?.id==='kpi2MonthSelect')writeState({view:'kpis',kpiMonth:e.target.value})},true);
  window.addEventListener('beforeunload',saveUi);
  let scrollTimer=null;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>writeState({scrollY:Math.max(0,Math.round(window.scrollY||0))}),180)},{passive:true});

  const st=window.__DWS_RESTORE_STATE||readState();
  let restoredView=false,restoredKpi=false,released=false;
  const release=()=>{if(released)return;released=true;document.documentElement.classList.remove('dws-restore-hold');const css=document.getElementById('dwsRestoreCss');if(css)css.remove()};
  function restoreFast(){
    const view=st.view;
    if(!restoredView){
      if(!view){restoredView=true}
      else if(document.getElementById(view)&&typeof window.go==='function'){
        try{window.go(view);restoredView=true}catch(e){}
      }
    }
    if(view!=='kpis'){restoredKpi=true}
    else if(!restoredKpi){
      const month=document.getElementById('kpi2MonthSelect');
      const tabsReady=document.getElementById('kpi2DailyTab')&&document.getElementById('kpi2MonthlyTab');
      if(month&&tabsReady){
        if(st.kpiMonth!=null&&[...month.options].some(o=>o.value===String(st.kpiMonth))){month.value=String(st.kpiMonth);month.dispatchEvent(new Event('change',{bubbles:true}))}
        if(st.kpiMode==='daily')document.getElementById('kpi2DailyTab')?.click();
        else document.getElementById('kpi2MonthlyTab')?.click();
        if(st.kpiFilter==='all')document.getElementById('kpi2AllDays')?.click();
        else document.getElementById('kpi2OnlyNok')?.click();
        restoredKpi=true;
      }
    }
    if(restoredView&&restoredKpi){
      requestAnimationFrame(()=>{window.scrollTo({top:Number(st.scrollY)||0,left:0,behavior:'auto'});requestAnimationFrame(release)});
      return true;
    }
    return false;
  }
  restoreFast();
  let tries=0;const timer=setInterval(()=>{tries++;if(restoreFast()||tries>100){clearInterval(timer);release()}},20);
  setTimeout(release,2200);
  setTimeout(()=>{const b=document.querySelector('.sidebox b');if(b)b.textContent=b.textContent.replace(/V\d+(?:\.\d+)+/,'V35.10.35')},300);
  console.info('Painel V35.10.35: posição persistente no F5 e login apenas na sessão atual.');
})();