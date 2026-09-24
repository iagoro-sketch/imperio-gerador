(()=>{
  'use strict';
  const VERSION='35.10.41';
  const byId=id=>document.getElementById(id);
  const log=(...a)=>console.info('D+1 V'+VERSION,...a);

  function ensureState(){
    try{
      if(!Array.isArray(state.d1))state.d1=[];
      if(!state.sourceMeta||typeof state.sourceMeta!=='object')state.sourceMeta={};
      if(!('d1File' in state.sourceMeta))state.sourceMeta.d1File='';
      return true;
    }catch(e){console.error('D+1: estado do Painel não disponível.',e);return false}
  }

  function injectCss(){
    if(byId('d1V351041Css'))return;
    const st=document.createElement('style');st.id='d1V351041Css';st.textContent=`
      .seg-sources{grid-template-columns:repeat(4,minmax(0,1fr))!important}
      .seg-source.d1-source{border-color:#9a5a19!important;box-shadow:inset 0 0 0 1px rgba(245,130,32,.10)}
      .d1-source .stepno{background:#4b2b11!important;color:#ffae61!important}
      .d1-optional{display:inline-block;margin-left:5px;padding:3px 6px;border-radius:999px;background:#4b2b11;color:#ffbd7b;border:1px solid #84501e;font-size:8px;vertical-align:1px}
      @media(max-width:1150px){.seg-sources{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:680px){.seg-sources{grid-template-columns:1fr!important}}
    `;document.head.appendChild(st);
  }

  function injectCard(){
    const sources=document.querySelector('#segment .seg-sources');
    if(!sources||byId('segD1File'))return;
    const card=document.createElement('div');
    card.className='seg-source d1-source';
    card.innerHTML=`<div class="stepno">04</div><h5>D+1 <span class="d1-optional">OPCIONAL</span></h5><p>Pedidos extras enviados <b>depois da roteirização</b>. A única chave é o <b>VEÍCULO</b>; o MAPA do arquivo é ignorado para direcionar a carga.</p><input id="segD1File" class="seg-file-native" type="file" accept=".xlsx,.xls,.csv,.txt"><div id="segD1Status" class="seg-source-status warn">Opcional • sem arquivo</div>`;
    sources.appendChild(card);
    const title=document.querySelector('#segment .guide-title h4');
    if(title&&/3 relatórios/i.test(title.textContent||''))title.textContent='1. Carregue os 3 relatórios + D+1 opcional';
    const note=document.querySelector('#segment .seg-next');
    if(note)note.innerHTML='<b>Como o DWS sabe?</b> Fluxo normal: MAPAS → Placa/Veículo → ROMANEIO → Cliente/Pedido → CORA → Produto/Quantidade. Se houver D+1, os itens extras entram <b>direto pelo VEÍCULO informado no arquivo</b>. O MAPA do D+1 não participa da chave.';
  }

  function setD1Status(type,text){
    const e=byId('segD1Status');if(!e)return;
    e.textContent=text;e.className='seg-source-status '+(type||'warn');
  }
  function refreshD1Status(){
    if(!ensureState())return;
    const n=state.d1.length;
    const v=n?new Set(state.d1.map(x=>cleanCode(x._vehicle)).filter(Boolean)).size:0;
    setD1Status(n?'ok':'warn',n?`✓ ${n} item(ns) D+1 • ${v} veículo(s)`:'Opcional • sem arquivo');
  }

  function d1MatrixToObjects(matrix){
    const rows=(matrix||[]).slice(0);if(!rows.length)return [];
    const token=v=>norm(v);
    const primary=['pedido','data pedido','cod. pdv','cod pdv','nome pdv','setor','produto','quant. venda','quant venda','tipo'];
    const aux=['veiculo','mapa'];
    let main=-1,best=-1;
    for(let i=0;i<Math.min(rows.length,20);i++){
      const vals=(rows[i]||[]).map(token);
      const score=primary.reduce((n,k)=>n+(vals.includes(norm(k))?1:0),0);
      if(score>best){best=score;main=i}
    }
    if(main<0||best<2)return matrixToObjects(rows,['Pedido','Produto']);
    let extra=-1,extraScore=-1;
    for(let j=Math.max(0,main-2);j<=Math.min(rows.length-1,main+3);j++){
      if(j===main)continue;
      const vals=(rows[j]||[]).map(token);
      const score=aux.reduce((n,k)=>n+(vals.includes(norm(k))?1:0),0);
      if(score>extraScore){extraScore=score;extra=j}
    }
    const a=rows[main]||[],b=extra>=0?rows[extra]||[]:[];
    const n=Math.max(a.length,b.length),headers=[];
    const strongTop=new Set(primary.map(norm));
    for(let i=0;i<n;i++){
      const top=String(a[i]??'').trim(),bottom=String(b[i]??'').trim(),nt=norm(top),nb=norm(bottom);
      let h='';
      if(nb==='veiculo'||nb==='mapa')h=bottom;
      else if(strongTop.has(nt))h=top;
      else if(nt.includes('unidade')&&bottom)h=(top+' '+bottom).trim();
      else if(top)h=top;
      else if(bottom)h=bottom;
      else h=`col${i}`;
      headers.push(h);
    }
    const start=Math.max(main,extra)+1;
    return rows.slice(start).filter(r=>r.some(v=>String(v??'').trim()!=='')).map(r=>rowObj(headers,r));
  }

  function d1ProductDesc(code){
    const hit=(state.cora||[]).find(r=>cleanCode(getField(r,['Cód. produto']))===cleanCode(code));
    const desc=hit?String(getField(hit,['Desc. produto'])).trim():'';
    return desc||('PRODUTO '+cleanCode(code));
  }
  function normalizeD1Rows(rows){
    const out=[],seen=new Set();
    for(const r of rows||[]){
      const vehicle=cleanCode(getField(r,['VEÍCULO','VEICULO','Veículo','Veiculo']));
      const order=cleanCode(getField(r,['Pedido','Número pedido','Numero pedido']));
      const client=cleanCode(getField(r,['Cod. PDV','Cod PDV','Cód. PDV','Código Cliente','Codigo Cliente','PDV']));
      const product=cleanCode(getField(r,['Produto','Cód. produto','Cod. produto','Cod Produto']));
      const qty=numBR(getField(r,['Quant. venda','Quant venda','Quantidade','Qtd']));
      const unit=String(getField(r,['Unidade','Unidade produto','Unidade venda'])).trim()||'cx';
      const name=String(getField(r,['Nome PDV','Nome','Razão Social','Razao Social'])).trim().replace(/\s+/g,' ');
      const type=String(getField(r,['TIPO','Tipo'])).trim();
      if(!vehicle||!client||!product||!qty)continue;
      const dedupe=[order,client,product,String(qty),norm(unit),vehicle].join('|');
      if(seen.has(dedupe))continue;seen.add(dedupe);
      out.push({
        'Número pedido':order||'D+1','Cód. cliente':client,'Nome fantasia':name,'Nome cliente':name,
        'Cód. produto':product,'Desc. produto':d1ProductDesc(product),'Quant. venda':qty,'Unidade venda':unit,
        'Situação atend. item':'ATENDIDO','_d1':true,'_vehicle':vehicle,'_d1Type':type,'_source':'D+1'
      });
    }
    return out;
  }
  function d1RowsForVehicle(vehicle){return (state.d1||[]).filter(r=>cleanCode(r._vehicle)===cleanCode(vehicle))}
  function d1ClientRows(vehicle,client){return d1RowsForVehicle(vehicle).filter(r=>cleanCode(getField(r,['Cód. cliente']))===cleanCode(client))}

  async function processD1File(f){
    if(!f)return;ensureState();state.sourceMeta.d1File=f.name;setD1Status('reading','Lendo D+1...');
    try{
      let rows=[];
      if(/\.csv|\.txt/i.test(f.name))rows=parseCSV(await readTextFile(f));
      else{const {matrix}=await xlsxRows(f);rows=d1MatrixToObjects(matrix)}
      const normalized=normalizeD1Rows(rows);
      if(!normalized.length)throw new Error('Arquivo lido, mas não encontrei linhas válidas. Verifique VEÍCULO + Cod. PDV + Produto + Quant. venda. Cabeçalho em 2 linhas é aceito.');
      state.d1=normalized;refreshD1Status();
      if(state.route)routeChanged(state.maps);
      try{refreshAll()}catch(e){}
      log('arquivo carregado',f.name,state.d1.length,'itens');
    }catch(err){state.d1=[];refreshD1Status();setD1Status('err','ERRO: '+err.message);alertEl('segAlert','err','D+1: '+err.message)}
  }

  function installBehavior(){
    if(!ensureState())return;
    const d1file=byId('segD1File');if(d1file)d1file.onchange=e=>processD1File(e.target.files[0]);

    if(typeof refreshAll==='function'&&!refreshAll.__d1){
      const baseRefresh=refreshAll;
      const wrapped=function(){const r=baseRefresh.apply(this,arguments);refreshD1Status();return r};wrapped.__d1=true;refreshAll=wrapped;
    }

    if(typeof routeChanged==='function'&&!routeChanged.__d1){
      const baseRouteChanged=routeChanged;
      const wrapped=function(maps){
        const r=baseRouteChanged.apply(this,arguments);
        try{
          if(state.route&&state.routeLink?.coverage===100){
            const n=d1RowsForVehicle(state.route.vehicle).length;
            if(n)alertEl('segAlert','ok',`Compatibilidade confirmada em 100%: os ${state.routeLink.total} pedidos do veículo ${state.route.vehicle} no Romaneio foram encontrados no CORA por <b>Pedido + Cliente</b>. <b>+ ${n} item(ns) D+1</b> já vinculado(s) diretamente pelo veículo. Agora digite o cliente que será segmentado.`);
          }
        }catch(e){}
        return r;
      };wrapped.__d1=true;routeChanged=wrapped;
    }

    const input=byId('clientInput');
    if(input){
      input.oninput=()=>{
        const code=cleanCode(input.value);
        const romRows=code?(state.routeRom||[]).filter(r=>cleanCode(getField(r,['Código Cliente']))===code):[];
        const d1Rows=code&&state.route?d1ClientRows(state.route.vehicle,code):[];
        const existsRom=romRows.length>0,existsD1=d1Rows.length>0;
        byId('clientCode').value=code||'';byId('mClients').textContent=code||'-';state.selectedClient=null;byId('generateBtn').disabled=true;
        if(!code){if(byId('mClientState'))byId('mClientState').textContent='aguardando você digitar';return}
        if(!existsRom&&!existsD1){if(byId('mClientState'))byId('mClientState').textContent='não pertence ao veículo';alertEl('segAlert','err',`O cliente <b>${code}</b> não pertence ao veículo ${state.route?.vehicle||''} no Romaneio nem no D+1 carregado.`);return}
        const totalClientOrders=state.routeLink.clientTotals?.[code]||0;
        const matchedClientOrders=state.routeLink.clientMatched?.[code]||0;
        const clientComplete=totalClientOrders>0&&matchedClientOrders===totalClientOrders;
        const vehicleComplete=state.routeLink.total>0&&state.routeLink.matched===state.routeLink.total;
        if(!existsRom&&existsD1){
          if(!state.cora.length){if(byId('mClientState'))byId('mClientState').textContent='D+1 OK, falta CORA';alertEl('segAlert','warn',`Cliente <b>${code}</b> veio no D+1 do veículo <b>${state.route.vehicle}</b>. O vínculo D+1 está correto, mas os 3 arquivos normais ainda precisam estar carregados.`);return}
          if(!vehicleComplete){if(byId('mClientState'))byId('mClientState').textContent='D+1 OK, carga normal incompleta';alertEl('segAlert','warn',`Cliente <b>${code}</b> veio no D+1 e está vinculado diretamente ao veículo <b>${state.route.vehicle}</b>. Porém a carga normal está incompleta (${state.routeLink.matched}/${state.routeLink.total}); a OCP permanece bloqueada.`);return}
          state.selectedClient=code;byId('generateBtn').disabled=false;if(byId('mClientState'))byId('mClientState').textContent='D+1 validado pelo veículo';
          alertEl('segAlert','ok',`Cliente <b>${code}</b> validado pelo <b>D+1</b>. ${d1Rows.length} item(ns) irão para a OCP do veículo <b>${state.route.vehicle}</b>. O MAPA do D+1 foi ignorado.`);return
        }
        const expected=[];
        for(const rr of romRows)for(const raw of splitOrders(getField(rr,['Pedido']))){const transformed=romOrderToCora(raw,state.routeLink.expectedDate||'');if(raw&&raw!=='-')expected.push(`${raw} → ${transformed}`)}
        if(byId('mClientState'))byId('mClientState').textContent=!clientComplete?`${matchedClientOrders}/${totalClientOrders} pedidos no Cora`:!vehicleComplete?'cliente OK, carga incompleta':'validado para gerar OCP';
        if(!state.cora.length){alertEl('segAlert','warn',`Cliente ${code} pertence ao veículo ${state.route.vehicle}. Pedido(s) esperado(s) no Cora: <b>${expected.join(', ')}</b>. Falta carregar o CORA.`);return}
        if(!clientComplete){alertEl('segAlert','err',`Cliente <b>${code}</b> pertence ao veículo <b>${state.route.vehicle}</b> ✅. Pedido(s) do Romaneio: <b>${expected.join(', ')||'não identificado'}</b>. No CORA foram encontrados <b>${matchedClientOrders} de ${totalClientOrders}</b> pedido(s) desse cliente. A <b>data do Cora não é usada</b>; precisa fechar Pedido + Cliente.`);return}
        if(!vehicleComplete){alertEl('segAlert','warn',`Os pedidos do cliente ${code} estão corretos, porém a carga completa do veículo está em <b>${state.routeLink.matched}/${state.routeLink.total}</b>. A OCP ficou bloqueada porque o Picking ficaria incompleto.`);return}
        state.selectedClient=code;byId('generateBtn').disabled=false;
        const itemCount=[...(state.routeCora||[]),...d1RowsForVehicle(state.route.vehicle)].filter(r=>cleanCode(getField(r,['Cód. cliente']))===code).length;
        alertEl('segAlert','ok',`Cliente ${code} validado por <b>Pedido + Cliente</b>. ${totalClientOrders} pedido(s) e ${itemCount} linha(s) de produto encontradas. Clique em Gerar OCP.`);
      };
    }

    const oldClientName=typeof clientName==='function'?clientName:null;
    if(oldClientName&&!oldClientName.__d1){
      const wrapped=function(code){const n=oldClientName(code);if(n)return n;const d=state.route?d1ClientRows(state.route.vehicle,code)[0]:null;return d?String(getField(d,['Nome fantasia','Nome cliente'])).trim():''};wrapped.__d1=true;clientName=wrapped;
    }

    const gen=byId('generateBtn');
    if(gen){
      gen.onclick=()=>{
        if(!state.route||!state.selectedClient||!state.routeCora.length||state.routeLink.coverage!==100)return;
        const routeD1=d1RowsForVehicle(state.route.vehicle),full=[...state.routeCora,...routeD1];
        const segSource=full.filter(r=>cleanCode(getField(r,['Cód. cliente']))===state.selectedClient);
        if(!segSource.length){alertEl('segAlert','err','O cliente não possui itens vinculados a este veículo no CORA nem no D+1.');return}
        const pickSource=full.filter(r=>cleanCode(getField(r,['Cód. cliente']))!==state.selectedClient);
        state.reports.segAnom=anomalyCount(segSource);state.reports.pickAnom=anomalyCount(pickSource);state.reports.seg=groupProducts(segSource);state.reports.pick=groupProducts(pickSource);
        state.reports.conf=full.map(r=>{const c=cleanCode(getField(r,['Cód. cliente'])),q=normalizeQty(r);return{dest:c===state.selectedClient?'SEGMENTAÇÃO':'PICKING',client:c,name:String(getField(r,['Nome fantasia','Nome cliente'])).trim(),order:cleanCode(getField(r,['Número pedido'])),product:cleanCode(getField(r,['Cód. produto'])),desc:String(getField(r,['Desc. produto'])).trim(),qty:q.qty,unit:q.unit,status:itemStatus(r),source:r._d1?'D+1':'CORA'}});
        renderReportTables();buildPrintSheets();byId('results').style.display='block';
        alertEl('segAlert','ok',`OCP gerada considerando somente itens ATENDIDO. ${state.reports.seg.length} SKUs foram para Segmentação e ${state.reports.pick.length} SKUs permaneceram no Picking. Anomalias excluídas: ${state.reports.segAnom+state.reports.pickAnom}.${routeD1.length?' D+1 incorporado ao veículo: '+routeD1.length+' item(ns).':''}`);
        byId('results').scrollIntoView({behavior:'smooth',block:'start'});
      };
    }

    const clear=byId('clearOperational');
    if(clear&&!clear.__d1){
      const old=clear.onclick;clear.onclick=function(){const before=state.d1?.length||0;const r=old&&old.apply(this,arguments);if(before&&Array.isArray(state.d1)){state.d1=[];state.sourceMeta.d1File='';if(byId('segD1File'))byId('segD1File').value='';refreshD1Status()}return r};clear.__d1=true;
    }
    refreshD1Status();
  }

  try{injectCss();injectCard();installBehavior();log('ativo: arquivo opcional por VEÍCULO, cabeçalho D+1 em 2 linhas aceito.')}catch(e){console.error('Falha D+1 V'+VERSION,e)}
})();
