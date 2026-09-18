(()=>{(async()=>{try{
  const r=await fetch('./kpi-v35-10-26.b64?v=35-10-39',{cache:'no-store'});
  if(!r.ok)throw new Error('Base KPI nao encontrada: HTTP '+r.status);
  let b64=(await r.text()).replace(/\s+/g,'');
  const end=b64.lastIndexOf('XQAA');if(end>=0)b64=b64.slice(0,end+4);
  const bin=atob(b64),bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  if(!('DecompressionStream' in window))throw new Error('Atualize Chrome ou Edge.');
  const ds=new DecompressionStream('gzip');
  let js=await new Response(new Blob([bytes]).stream().pipeThrough(ds)).text();
  // O bundle usa 'use strict' com eval indireto. Suas funcoes ficam isoladas
  // nesse escopo e scripts externos nao podem acessar o historico diario.
  // Expor apenas as bases e funcoes necessarias, preservando o bundle original
  // e os lancamentos do usuario em localStorage.
  const names=['DAILY_SEED','MONTH_SEED','KEYS','LABELS','META','SENSE','PERCENT','MONTHS','BASELABEL'];
  for(const suffix of names){
    const key='KPI2_'+suffix;
    const re=new RegExp('\\b(?:const|let|var)\\s+'+key+'\\s*=','g');
    js=js.replace(re,'window.'+key+'=');
  }
  const functions=['kpi2Records','kpi2Record','kpi2MonthRows','kpi2RenderDaily','kpi2RenderMonthly','kpi2DailyMemory','kpi2MonthMemory','kpi2YearMemory','kpi2LoadSaved','kpi2SaveSaved','kpi2Fmt','kpi2FmtMeta','kpi2Good','kpi2OpenLead','kpi2OpenModal','kpi2CloseModal','kpi2SaveDay','kpi2DeleteDay','kpi2Switch'];
  js+='\n;'+functions.map(n=>'window.'+n+'='+n).join(';')+';';
  (0,eval)(js);
  if(!Array.isArray(window.KPI2_DAILY_SEED)||typeof window.kpi2RenderDaily!=='function'||typeof window.kpi2Records!=='function'){
    throw new Error('Base ou funcoes KPI nao foram disponibilizadas.');
  }
  console.info('KPI V35.10.39: funcoes e dados do historico diario disponiveis.');
}catch(e){console.error('Falha ao carregar KPI V35.10.39',e)}})()})();