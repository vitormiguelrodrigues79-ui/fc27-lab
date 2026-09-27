import React, {useEffect, useRef, useState} from 'react';
import {Search, Plus, X} from 'lucide-react';
import {supabase} from './supabase';
const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const labels = {overall:'Overall',pace:'Ritmo',shooting:'Remate',passing:'Passe',dribbling:'Drible',defending:'Defesa',physical:'Físico',weak_foot:'Pé fraco',skill_moves:'Fintas'};
export default function PlayerEntry({players,uid,onSaved,onClose,title='Adicionar jogador',submitLabel='Guardar jogador'}) {
 const [query,setQuery]=useState(''),[results,setResults]=useState([]),[selected,setSelected]=useState(null),[mode,setMode]=useState('search'),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[searched,setSearched]=useState(false),[retry,setRetry]=useState(0);
 const serial=useRef(0);
 const locals=query.trim().length>=3 ? players.filter(p=>normalize(p.name).includes(normalize(query.trim()))).slice(0,10) : [];
 useEffect(()=>{
   const id=++serial.current;setResults([]);setSearched(false);setError('');
   if(mode!=='search'||query.trim().length<3||selected){setBusy(false);return;}
   setBusy(true);
   const timer=setTimeout(async()=>{
    try {
     const {data,error:failure}=await supabase.functions.invoke('fc27-player-search',{body:{query:query.trim()}});
     if(serial.current!==id)return;
     if(failure){let detail;try{detail=await failure.context?.json()}catch{}throw new Error(detail?.error||'Não foi possível pesquisar. Tenta novamente.');}
     if(data?.error)throw new Error(data.error);
     if(!Array.isArray(data?.players))throw new Error('A pesquisa devolveu uma resposta inesperada.');
     setResults(data.players);setSearched(true);
    }catch(e){if(serial.current===id)setError(e.message)}finally{if(serial.current===id)setBusy(false)}
   },450);
   return()=>{clearTimeout(timer);serial.current++};
 },[query,mode,selected,retry]);
 async function save(e){
  e.preventDefault();if(saving)return;setSaving(true);setError('');
  try{
   let record;
   if(selected?.id){record=selected;}
   else {
    const form=Object.fromEntries(new FormData(e.currentTarget));
    let payload;
    if(selected){const {full_name,...card}=selected;payload=card;}
    else {payload={...form,source:'manual',card_type:'base'};for(const key of Object.keys(labels))payload[key]=form[key]===''?null:Number(form[key]);}
    payload.created_by=uid;
    if(payload.ea_id){const {data,error}=await supabase.from('fc27_players').select('*').eq('ea_id',payload.ea_id).eq('card_type','base').eq('is_active',true).limit(1).maybeSingle();if(error)throw error;record=data;}
    if(!record){const {data,error}=await supabase.from('fc27_players').insert(payload).select().single();if(error)throw error;record=data;}
   }
   await onSaved(record);
  }catch(e){setError(e.message||'Não foi possível guardar o jogador.')}finally{setSaving(false)}
 }
 const external=results.filter(p=>!locals.some(local=>local.ea_id===p.ea_id&&local.card_type==='base'));
 return <section className="card player-entry" aria-label={title}>
  <div className="section-head"><h3>{title}</h3><button type="button" className="btn" aria-label="Fechar pesquisa" onClick={onClose}><X size={18}/></button></div>
  <div className="entry-tabs"><button type="button" className={'btn '+(mode==='search'?'primary':'')} onClick={()=>{setMode('search');setSelected(null);setError('')}}>Pesquisar na EA</button><button type="button" className={'btn '+(mode==='manual'?'primary':'')} onClick={()=>{setMode('manual');setSelected(null);setError('')}}>Inserir manualmente</button></div>
  {mode==='search'&&<><label className="field-label" htmlFor="player-name-search">Nome do jogador</label><div className="search-field"><Search size={18}/><input id="player-name-search" className="input" autoFocus value={query} maxLength={60} onChange={e=>{setSelected(null);setQuery(e.target.value)}} placeholder="Ex.: João Neves, Mbappé, Gyökeres…" autoComplete="off"/></div><p className="muted entry-hint">Escreve pelo menos 3 letras. Cartas base FC 27 da EA; cartas especiais e Evolutions podem ser inseridas manualmente.</p>
  <div role="status" aria-live="polite">{busy&&<p className="muted">A procurar jogadores…</p>}{!busy&&searched&&!selected&&external.length+locals.length===0&&<p className="muted">Nenhum jogador encontrado. Tenta um apelido ou adiciona manualmente.</p>}</div>
  {!selected&&(locals.length>0||external.length>0)&&<div className="player-results" aria-label="Resultados da pesquisa">{[...locals,...external].map(p=><button key={p.id||p.ea_id} type="button" className="player-result" onClick={()=>{setSelected(p);setError('')}}><span className="avatar">{p.overall||'—'}</span><span className="result-info"><strong>{p.name}</strong><small>{p.primary_position} · {p.club} · {p.nation}</small><small>{p.id?(p.card_name||'Já na tua base'):'Carta base FC 27 · EA'}</small></span>{p.id?<span className="tag">Na base</span>:<Plus size={18}/>}</button>)}</div>}
  {selected&&<div className="player-preview"><strong>{selected.name}</strong><p className="muted">{selected.primary_position} · {selected.club} · {selected.league} · {selected.nation}</p><div className="preview-stats">{Object.entries(labels).map(([key,label])=><div key={key}><small>{label}</small><b>{selected[key]??'—'}</b></div>)}</div>{selected.source_url&&<a className="source-link" href={selected.source_url} target="_blank" rel="noreferrer">Ver ficha na EA ↗</a>}</div>}
  </>}
  <form className="form" onSubmit={save}>
  {mode==='manual'&&<><label className="wide field-label">Nome<input className="input" name="name" required placeholder="Nome do jogador"/></label><label className="field-label">Carta / promoção<input className="input" name="card_name" placeholder="Ex.: TOTW"/></label><label className="field-label">Posição<input className="input" name="primary_position" placeholder="Ex.: CM"/></label><label className="field-label">Clube<input className="input" name="club"/></label><label className="field-label">Liga<input className="input" name="league"/></label><label className="field-label">Nacionalidade<input className="input" name="nation"/></label>{Object.entries(labels).map(([key,label])=><label className="field-label" key={key}>{label}<input className="input" name={key} type="number" min="1" max={key==='weak_foot'||key==='skill_moves'?5:99}/></label>)}</>}
  {(mode==='manual'||selected)&&<button className="btn primary wide" disabled={saving}>{saving?'A guardar…':submitLabel}</button>}
  </form>
  {error&&<div className="entry-error" role="alert"><p>{error}</p>{mode==='search'&&!selected&&<button type="button" className="btn" onClick={()=>setRetry(x=>x+1)}>Tentar novamente</button>}</div>}
 </section>
}
