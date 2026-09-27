import React, {useState} from 'react';
import {supabase} from './supabase';
export default function CoinsBudget({squad,onUpdated}) {
 const [editing,setEditing]=useState(false),[value,setValue]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 function edit(){setValue(String(squad?.coins??0));setEditing(true);setError('');setMessage('');}
 async function save(e){
  e.preventDefault();if(saving)return;
  const coins=Number(value);
  if(value.trim()===''||!Number.isInteger(coins)||coins<0||coins>2147483647){setError('Indica um número inteiro de moedas, igual ou superior a zero.');return;}
  setSaving(true);setError('');setMessage('');
  try{
   const {data,error}=await supabase.from('fc27_squads').update({coins}).eq('id',squad.id).eq('user_id',squad.user_id).select('id,coins').single();
   if(error)throw error;
   onUpdated(data.coins);setEditing(false);setMessage('Saldo guardado.');
  }catch(e){setError(e.message||'Não foi possível guardar. Tenta novamente.');}finally{setSaving(false)}
 }
 return <div className="card metric coins-budget"><span className="muted">Moedas disponíveis</span>
 {!editing?<><strong>{(squad?.coins??0).toLocaleString('pt-PT')}</strong><button type="button" className="btn" onClick={edit} disabled={!squad?.id}>Alterar saldo</button></>:<form onSubmit={save}><label htmlFor="coins-budget-value" className="field-label">Saldo atual</label><input id="coins-budget-value" className="input" type="number" inputMode="numeric" min="0" max="2147483647" step="1" required autoFocus value={value} onChange={e=>setValue(e.target.value)} disabled={saving}/><div className="budget-actions"><button className="btn primary" disabled={saving}>{saving?'A guardar…':'Guardar'}</button><button type="button" className="btn" onClick={()=>{setEditing(false);setError('')}} disabled={saving}>Cancelar</button></div></form>}
 {message&&<small role="status">{message}</small>}{error&&<small role="alert" className="budget-error">{error}</small>}
 </div>
}
