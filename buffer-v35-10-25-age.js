(()=>{
  try{
    if(typeof monBuffer!=='function'||typeof monRenderBuffer!=='function')return;

    function ageRawExcluded(r){
      const orderType=norm(getField(r,['Tipo pedido'])||'');
      const repoType=String(getField(r,['Tipo solicitação reposição'])||'').trim();
      const operation=norm(getField(r,['Desc. operação'])||'');
      const movement=norm(getField(r,['Desc. tipo movimento'])||'');
      return orderType==='reposicao'||!!repoType||movement==='simplesremessa'||movement==='troca'||operation.includes('reposicao')||operation.includes('trocaprod');
    }

    function ageRowExcluded(r){
      try{if(typeof monBufferExcluded==='function'&&monBufferExcluded(r))return true}catch(_e){}
      if(Number(r?.[28]||0)===1)return true;
      const orderType=typeof r?.[27]==='string'?norm(r[27]):'';
      const repoType=typeof r?.[28]==='string'?String(r[28]||'').trim():'';
      const operation=norm(r?.[29]||'');
      const movement=norm(r?.[30]||'');
      return orderType==='reposicao'||!!repoType||movement==='simplesremessa'||movement==='troca'||operation.includes('reposicao')||operation.includes('trocaprod');
    }

    function storedAge(r){
      const v=r?.[27];
      if(typeof v==='number'&&Number.isFinite(v))return v;
      if(typeof v==='string'&&/^\s*\d+(?:[.,]\d+)?\s*$/.test(v))return Number(v.replace(',','.'));
      return null;
    }

    function rawAge(order,client,target){
      let found=false,max=0;
      for(const r of (window.state?.cora||[])){
        if(ageRawExcluded(r))continue;
        const o=cleanCode(getField(r,['Número pedido'])),c=cleanCode(getField(r,['Cód. cliente']));
        if(o!==cleanCode(order)||c!==cleanCode(client))continue;
        const d=parseDateBR(getField(r,['Data entrega']))||parseDateBR(getField(r,['Data entrega original']))||parseDateBR(getField(r,['Data entrada']));
        if(target&&d&&d!==target)continue;
        const raw=getField(r,['Idade']);
        if(raw===undefined||raw===null||String(raw).trim()==='')continue;
        const n=numBR(raw);if(Number.isFinite(n)){found=true;max=Math.max(max,n)}
      }
      return found?max:null;
    }

    function dayDiff(a,b){
      if(!a||!b)return null;
      const da=new Date(a+'T12:00:00Z'),db=new Date(b+'T12:00:00Z');
      const n=Math.round((db-da)/86400000);return Number.isFinite(n)?Math.max(0,n):null;
    }

    function historyAge(order,client,target){
      const dates=[];
      for(const r of (monState?.rows||[])){
        if(cleanCode(r?.[1])!==cleanCode(order)||cleanCode(r?.[2])!==cleanCode(client))continue;
        if(ageRowExcluded(r))continue;
        if(typeof monBufferCancelled==='function'&&monBufferCancelled(r))continue;
        const d=String(r?.[0]||'').slice(0,10);if(!d||!target||d>target)continue;
        const hasBuffer=String(r?.[11]||'').trim()||storedAge(r)!==null;
        if(!hasBuffer)continue;
        dates.push(d);
      }
      const uniq=[...new Set(dates)].sort();
      if(!uniq.length)return{age:null,count:0,first:''};
      return{age:dayDiff(uniq[0],target),count:uniq.length,first:uniq[0]};
    }

    function ageInfo(order,client,target){
      const active=(monState?.rows||[]).filter(r=>cleanCode(r?.[1])===cleanCode(order)&&cleanCode(r?.[2])===cleanCode(client)&&(!target||typeof monBufferActiveOn!=='function'||monBufferActiveOn(r,target))&&!ageRowExcluded(r));
      const saved=active.map(storedAge).filter(v=>v!==null&&Number.isFinite(v));
      const fromRows=saved.length?Math.max(...saved):null;
      const fromRaw=rawAge(order,client,target);
      const source=fromRaw!==null?fromRaw:fromRows;
      const hist=historyAge(order,client,target);
      const age=source!==null?source:(hist.age!==null?hist.age:0);
      const checked=source!==null&&hist.age!==null&&hist.count>=2;
      return{age,source,histAge:hist.age,histCount:hist.count,first:hist.first,match:checked?Math.abs(source-hist.age)<=1:null};
    }

    const baseBuffer=monBuffer;
    monBuffer=function(period){
      const arr=baseBuffer(period),target=monState.to||monState.from;
      for(const x of arr){
        const i=ageInfo(x.order,x.client,target);
        x.age=Number(i.age||0);x.ageSource=i.source;x.ageHistory=i.histAge;x.ageHistoryCount=i.histCount;x.ageFirst=i.first;x.ageMatch=i.match;
      }
      return arr;
    };

    const style=document.createElement('style');
    style.textContent=`
      .buffer-table th.age-col,.buffer-table td.age-col{text-align:center;white-space:nowrap}
      .buffer-age-pill{display:inline-flex;align-items:center;justify-content:center;min-width:54px;padding:4px 8px;border-radius:999px;font-weight:800;background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.24)}
      .buffer-age-pill.alert{background:rgba(248,113,113,.18);border-color:rgba(248,113,113,.55);color:#ff8d98}
      .buffer-table tr.buffer-age-alert td{background:rgba(248,113,113,.045)}
    `;
    document.head.appendChild(style);

    function ensureAgeHeader(){
      const tr=document.querySelector('.buffer-table thead tr');if(!tr)return;
      if(tr.querySelector('[data-buffer-age-head]'))return;
      const ths=[...tr.querySelectorAll('th')],vol=ths.find(th=>norm(th.textContent).includes('volume'));
      const th=document.createElement('th');th.className='age-col';th.dataset.bufferAgeHead='1';th.textContent='Idade';
      if(vol)tr.insertBefore(th,vol);else tr.appendChild(th);
    }

    monRenderBuffer=function(arr){
      ensureAgeHeader();
      $('monBufferOrders').textContent=fmt(new Set(arr.map(x=>x.order)).size,0);
      if($('monBufferClients'))$('monBufferClients').textContent=fmt(new Set(arr.map(x=>x.client)).size,0);
      $('monBufferVolume').textContent=fmt(arr.reduce((s,x)=>s+x.volume,0),2);
      const p=monPaginate(arr,'buffer'),target=monState.to||monState.from,hasCycle=monBufferHasRoutingCycle(target);
      $('monBufferBody').innerHTML=p.rows.length?p.rows.map(x=>{
        const age=Number(x.age||0),alert=age>5;
        const src=x.ageSource===null||x.ageSource===undefined?'sem valor salvo':`${fmt(x.ageSource,0)} dia(s)`;
        const hist=x.ageHistory===null||x.ageHistory===undefined?'histórico insuficiente':`${fmt(x.ageHistory,0)} dia(s) desde ${dateBR(x.ageFirst)}`;
        const check=x.ageMatch===true?' • conferência OK':x.ageMatch===false?' • atenção: CORA e histórico diferem':'';
        const title=`Idade CORA: ${src} • Conferência pelo histórico: ${hist}${check}`;
        return `<tr class="${alert?'buffer-age-alert':''}"><td>${esc(x.order)}</td><td>${esc(x.client)}</td><td title="${esc(x.name)}">${esc(x.name)}</td><td>${esc(x.channel||'-')}</td><td class="age-col" title="${esc(title)}"><span class="buffer-age-pill ${alert?'alert':''}">${fmt(age,0)} dia${age===1?'':'s'}</span></td><td class="num">${fmt(x.volume,2)}</td></tr>`;
      }).join(''):monEmpty(6,hasCycle?'Nenhum pedido no Buffer na data selecionada.':'Sem ciclo de roteirização na data selecionada.');
      monSetPager('buffer',arr.length,p.page,p.total);
    };

    if(typeof exportSpecBuffer==='function'){
      exportSpecBuffer=function(d){return{name:'Pedidos no Buffer',title:'PEDIDOS NO BUFFER',headers:['PEDIDO','CÓD.','CLIENTE','CANAL','IDADE (DIAS)','VOLUME (HL)'],rows:d.buffer.map(x=>[x.order,x.client,x.name,x.channel,Number(x.age||0),Number(x.volume.toFixed(3))]),widths:[12,10,40,15,14,14]}};
    }

    ensureAgeHeader();
    if(window.monState?.ready&&document.getElementById('monitoring')?.classList.contains('active'))renderMonitoring();
    console.info('Painel Roteirizador: idade do Buffer V35.10.25 ativa. Idade > 5 dias destacada em vermelho.');
  }catch(e){console.error('Falha ao aplicar idade do Buffer V35.10.25',e)}
})();