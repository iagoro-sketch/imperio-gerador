(()=>{
  try{
    if(typeof monDeriveCora!=='function'||typeof monBufferActiveOn!=='function')return;

    const baseDerive=monDeriveCora;
    monDeriveCora=function(rows){
      const derived=baseDerive(rows);
      const ages=new Map();
      for(const r of rows||[]){
        const date=parseDateBR(getField(r,['Data entrega']))||parseDateBR(getField(r,['Data entrega original']))||parseDateBR(getField(r,['Data entrada']));
        const order=cleanCode(getField(r,['Número pedido']));
        const client=cleanCode(getField(r,['Cód. cliente']));
        const product=cleanCode(getField(r,['Cód. produto']));
        const unit=String(getField(r,['Unidade venda'])||'').trim();
        if(!date||!order||!client||!product)continue;
        const key=[date,order,client,product,unit].join('|');
        ages.set(key,Math.max(Number(ages.get(key)||0),numBR(getField(r,['Idade']))));
      }
      for(const x of derived||[]){
        const key=[x[0],x[1],x[2],x[5],x[8]].join('|');
        x[27]=Number(ages.get(key)||0);
      }
      return derived;
    };

    monBufferCancelled=function(r){
      const st=norm(r[18]||'');
      return st.includes('cancelad')||st.includes('anulad')||st.includes('rejeitad');
    };

    monBufferActiveOn=function(r,target){
      if(!target)return false;
      const type=String(r[11]||'').trim(),age=Number(r[27]||0);
      if(!type&&age<=0)return false;
      if(monBufferCancelled(r))return false;
      const original=String(r[20]||r[0]||'').slice(0,10),delivery=String(r[21]||r[0]||'').slice(0,10);
      if(!original||target<original||target>delivery)return false;

      // CORA de D+1: Idade > 0 ou Tipo buffer na própria data de entrega mantém o pedido no Buffer.
      if(r.length>27&&delivery===target&&(age>0||type))return true;

      // Regra legada para o histórico já incorporado ao painel.
      const send=String(r[22]||'').slice(0,10),pseudo=monBufferIsPseudoPlate(r[24]);
      if(!pseudo&&send&&send<target)return false;
      return true;
    };

    monBufferHasRoutingCycle=function(target){
      if(!target)return false;
      if(monState.rows.some(r=>r.length>27&&String(r[21]||r[0]||'').slice(0,10)===target&&!monBufferCancelled(r)&&(Number(r[27]||0)>0||String(r[11]||'').trim())))return true;
      return monState.rows.some(r=>String(r[22]||'').slice(0,10)===target);
    };

    console.info('Painel Roteirizador: correção Buffer V35.10.13 ativa.');
  }catch(e){console.error('Falha ao aplicar correção Buffer V35.10.13',e)}
})();
