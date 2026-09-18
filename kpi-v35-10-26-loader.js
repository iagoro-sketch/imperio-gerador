(()=>{(async()=>{try{
  const r=await fetch('./kpi-v35-10-26.b64?v=35-10-38',{cache:'no-store'});
  if(!r.ok)throw new Error('Base KPI nao encontrada: HTTP '+r.status);
  let b64=(await r.text()).replace(/\s+/g,'');
  const end=b64.lastIndexOf('XQAA');if(end>=0)b64=b64.slice(0,end+4);
  const bin=atob(b64),bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  if(!('DecompressionStream' in window))throw new Error('Atualize Chrome ou Edge.');
  const ds=new DecompressionStream('gzip');
  let js=await new Response(new Blob([bytes]).stream().pipeThrough(ds)).text();
  // A carga anterior usava eval indireto: const KPI2_* ficava invisivel aos
  // scripts de historico diario (27 e 37). Publicar apenas essas bases no
  // escopo global; nao tocar em lancamentos ou no armazenamento local.
  const names=['DAILY_SEED','MONTH_SEED','KEYS','LABELS','META','SENSE','PERCENT','MONTHS','BASELABEL'];
  for(const suffix of names){
    const key='KPI2_'+suffix;
    const re=new RegExp('\\b(?:const|let|var)\\s+'+key+'\\s*=','g');
    js=js.replace(re,'window.'+key+'=');
  }
  (0,eval)(js);
  if(!Array.isArray(window.KPI2_DAILY_SEED))throw new Error('Base diaria KPI nao exposta aos modulos de historico.');
  console.info('KPI V35.10.38: base compartilhada com historico Jan-Ago.');
}catch(e){console.error('Falha ao carregar KPI V35.10.38',e)}})()})();