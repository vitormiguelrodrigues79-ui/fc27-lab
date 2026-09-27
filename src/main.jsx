import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {supabase} from './supabase'
import {bestRole,roleFit} from './fit'
import {LogOut,Plus,RefreshCw,Search,Shield,Star,Users} from 'lucide-react'
import './styles.css'
import PlayerEntry from './PlayerEntry'

const tabs=['Dashboard','Plantel','Jogadores','Táticas','Watchlist']
const squadSlots=['ST','LW','CAM','RW','CM1','CM2','LB','CB1','CB2','RB','GK']

function Login(){
  const login=()=>supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}})
  return <div className="login"><div className="card"><div className="mark" style={{margin:'auto'}}>27</div><h1>FC <span className="accent">LAB</span></h1><p className="muted">Squad intelligence para FC 27. Meta, tática e upgrades sem ruído.</p><button className="btn primary" onClick={login}>Entrar com Google</button><p className="muted" style={{fontSize:12}}>B612 · v1.1</p></div></div>
}

function App(){
 const [session,setSession]=useState(null),[tab,setTab]=useState('Dashboard'),[players,setPlayers]=useState([]),[squad,setSquad]=useState(null),[squadPlayers,setSquadPlayers]=useState([]),[tactics,setTactics]=useState([]),[watch,setWatch]=useState([]),[prices,setPrices]=useState([]),[loading,setLoading]=useState(true)
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[])
 useEffect(()=>{if(session) loadAll()},[session])
 async function loadAll(){setLoading(true);const uid=session.user.id;const [p,t,s,w,pr]=await Promise.all([
   supabase.from('fc27_players').select('*').eq('is_active',true).order('overall',{ascending:false}),
   supabase.from('fc27_tactics').select('*,fc27_tactic_roles(*)').order('created_at',{ascending:false}),
   supabase.from('fc27_squads').select('*').eq('user_id',uid).eq('is_active',true).limit(1).maybeSingle(),
   supabase.from('fc27_watchlist').select('*,fc27_players(*)').eq('user_id',uid),
   supabase.from('fc27_price_observations').select('*').order('observed_at',{ascending:false}).limit(250)
 ]); setPlayers(p.data||[]);setTactics(t.data||[]);setWatch(w.data||[]);setPrices(pr.data||[]);let sq=s.data;if(!sq){const r=await supabase.from('fc27_squads').insert({user_id:uid,name:'Main Squad',formation:'4-2-3-1'}).select().single();sq=r.data} setSquad(sq); if(sq){const sp=await supabase.from('fc27_squad_players').select('*,fc27_players(*)').eq('squad_id',sq.id);setSquadPlayers(sp.data||[])} setLoading(false)}
 if(!session)return <Login/>
 const latestPrice=id=>prices.find(x=>x.player_id===id)?.price
 const avgFit=squadPlayers.length?Math.round(squadPlayers.reduce((a,x)=>a+bestRole(x.fc27_players).score,0)/squadPlayers.length):0
 return <div className="app"><header className="top"><div className="brand"><div className="mark">27</div><div><h1>FC LAB</h1><small>B612 · v1.1</small></div></div><button className="btn" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/></button></header><nav className="nav">{tabs.map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav><main className="shell">{loading?<p className="muted">A carregar…</p>:<>{tab==='Dashboard'&&<Dashboard squad={squad} squadPlayers={squadPlayers} fit={avgFit} watch={watch} latestPrice={latestPrice}/>} {tab==='Plantel'&&<SquadView squad={squad} items={squadPlayers} players={players} reload={loadAll}/>} {tab==='Jogadores'&&<Players players={players} reload={loadAll} latestPrice={latestPrice} uid={session.user.id}/>} {tab==='Táticas'&&<Tactics tactics={tactics} reload={loadAll} uid={session.user.id}/>} {tab==='Watchlist'&&<Watch items={watch} latestPrice={latestPrice} reload={loadAll} uid={session.user.id}/>}</>}</main></div>
}

function Dashboard({squad,squadPlayers,fit,watch,latestPrice}){const weak=[...squadPlayers].sort((a,b)=>bestRole(a.fc27_players).score-bestRole(b.fc27_players).score)[0];return <><div className="hero"><div className="card"><span className="tag">SQUAD DOCTOR</span><h2>A tua equipa,<br/><span className="accent">sem achismos.</span></h2><p className="muted">A V1 calcula Fit localmente a partir dos atributos, PlayStyles, WF/SM e função. Os pesos serão afinados com uso real.</p></div><div className="card"><div className="muted">TEAM FIT</div><div className="big-score">{fit||'—'}</div><div className="muted">{squadPlayers.length}/11 posições preenchidas</div></div></div><div className="grid"><div className="card metric"><span className="muted">Coins</span><strong>{(squad?.coins||0).toLocaleString('pt-PT')}</strong></div><div className="card metric"><span className="muted">Watchlist</span><strong>{watch.length}</strong></div><div className="card metric"><span className="muted">Ponto fraco</span><strong>{weak?weak.slot_key:'—'}</strong>{weak&&<small className="muted">Fit {bestRole(weak.fc27_players).score}</small>}</div></div>{weak&&<div className="card" style={{marginTop:18}}><div className="section-head"><div><span className="tag">PRIORIDADE</span><h2>Melhorar {weak.slot_key}</h2></div><div className="score">{bestRole(weak.fc27_players).score}</div></div><p className="muted">{weak.fc27_players.name} é neste momento o jogador com menor Fit estimado no onze.</p></div>}</>}

function SquadView({squad,items,players,reload}) {
 const [selectedSlot,setSelectedSlot]=useState(null);
 const map=Object.fromEntries(items.map(x=>[x.slot_key,x]));
 async function assignPlayer(player){
  if(!squad?.id)throw new Error('Não foi possível carregar o plantel. Atualiza a página.');
  const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)throw new Error('Volta a iniciar sessão.');
  const {error}=await supabase.from('fc27_squad_players').upsert({squad_id:squad.id,user_id:user.id,player_id:player.id,slot_key:selectedSlot},{onConflict:'squad_id,slot_key'});
  if(error)throw error;await reload();setSelectedSlot(null);
 }
 return <><div className="section-head"><div><h2>My Squad</h2><p className="muted">{squad?.formation} · Toca numa posição para procurar um jogador.</p></div></div>
 {selectedSlot&&<PlayerEntry key={selectedSlot} players={players} uid={squad?.user_id} title={'Jogador para '+selectedSlot} submitLabel={'Colocar em '+selectedSlot} onClose={()=>setSelectedSlot(null)} onSaved={assignPlayer}/>}
 <div className="squad"><div className="pitch-line"/><div className="slots">{squadSlots.map(slot=>{const x=map[slot];return <button type="button" className={`slot s-${slot} ${x?'':'empty'}`} key={slot} onClick={()=>setSelectedSlot(slot)} aria-label={'Escolher jogador para '+slot}><b>{slot}</b>{x?<>{x.fc27_players.name}<br/><span className="accent">FIT {bestRole(x.fc27_players).score}</span></>:<span>+ Procurar</span>}</button>})}</div></div></>
}

function Players({players,reload,latestPrice,uid}){const [q,setQ]=useState(''),[open,setOpen]=useState(false);const filtered=players.filter(p=>(p.name+' '+(p.card_name||'')+' '+(p.club||'')).toLowerCase().includes(q.toLowerCase()));async function price(id){const v=prompt('Preço atual (coins)');if(v)await supabase.from('fc27_price_observations').insert({player_id:id,user_id:uid,price:Number(v)});reload()}return <><div className="section-head"><div><h2>Jogadores</h2><p className="muted">Pesquisa na EA e guarda os jogadores que te interessam.</p></div><button className="btn primary" onClick={()=>setOpen(!open)}><Plus size={15}/> Adicionar</button></div>{open&&<PlayerEntry players={players} uid={uid} onClose={()=>setOpen(false)} onSaved={async()=>{await reload();setOpen(false)}}/>}<div style={{position:'relative',margin:'14px 0'}}><Search size={17} style={{position:'absolute',left:12,top:12,color:'#7f8995'}}/><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Pesquisar jogador, clube…" style={{paddingLeft:38}}/></div><div className="list">{filtered.map(p=>{const b=bestRole(p);return <div className="row" key={p.id}><div className="row-left"><div className="avatar">{p.overall||'—'}</div><div><strong>{p.name}</strong><div className="tags"><span className="tag">{p.primary_position||'?'}</span><span className="tag">{p.card_name||p.card_type}</span><span className="tag">{b.role}</span></div><small className="muted">{latestPrice(p.id)?latestPrice(p.id).toLocaleString('pt-PT')+' coins':'Sem preço'}</small></div></div><div style={{textAlign:'right'}}><div className="score">{b.score}</div><button className="btn" onClick={()=>price(p.id)}>Preço</button></div></div>})}</div></>}

function Tactics({tactics,reload,uid}){const [open,setOpen]=useState(false);async function add(e){e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));f.created_by=uid;const {error}=await supabase.from('fc27_tactics').insert(f);if(error)alert(error.message);else{setOpen(false);reload()}}return <><div className="section-head"><div><h2>Tactical Lab</h2><p className="muted">Guarda códigos, formação e patch.</p></div><button className="btn primary" onClick={()=>setOpen(!open)}><Plus size={15}/> Tática</button></div>{open&&<form className="card form" onSubmit={add}><input className="input" name="name" placeholder="Nome" required/><input className="input" name="author" placeholder="Autor"/><input className="input" name="formation" placeholder="4-2-3-1" required/><input className="input" name="ea_code" placeholder="Código EA"/><input className="input" name="patch" placeholder="Patch"/><input className="input" name="line_height" type="number" placeholder="Line height"/><textarea className="input wide" name="notes" placeholder="Notas"/><button className="btn primary wide">Guardar tática</button></form>}<div className="list" style={{marginTop:14}}>{tactics.map(t=><div className="row" key={t.id}><div><strong>{t.name}</strong><div className="tags"><span className="tag">{t.formation}</span>{t.patch&&<span className="tag">{t.patch}</span>}</div><small className="muted">{t.author||'Tática pessoal'} {t.ea_code&&'· '+t.ea_code}</small></div><Shield className="accent"/></div>)}</div></>}

function Watch({items,latestPrice,reload,uid}){async function addPrice(p){const v=prompt('Preço atual (coins)');if(v){await supabase.from('fc27_price_observations').insert({player_id:p.id,user_id:uid,price:Number(v)});reload()}}return <><div className="section-head"><div><h2>Watchlist</h2><p className="muted">Os dois utilizadores partilham observações de preço.</p></div></div><div className="list">{items.map(x=><div className="row" key={x.id}><div className="row-left"><Star className="accent"/><div><strong>{x.fc27_players.name}</strong><small className="muted" style={{display:'block'}}>Target {x.target_price?.toLocaleString('pt-PT')||'—'} · Atual {latestPrice(x.player_id)?.toLocaleString('pt-PT')||'—'}</small></div></div><button className="btn" onClick={()=>addPrice(x.fc27_players)}><RefreshCw size={14}/></button></div>)}</div>{!items.length&&<div className="card"><p className="muted">Ainda sem jogadores na watchlist. A ação “Adicionar à watchlist” entra na próxima iteração desta V1.</p></div>}</>}

createRoot(document.getElementById('root')).render(<App/>)
