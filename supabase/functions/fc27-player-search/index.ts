import { normalizeSearch, parseRatings } from './provider.js';
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status, headers});
const cache = new Map<string,{expires:number,data:unknown}>();
const requests = new Map<string,{count:number,reset:number}>();
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers});
  if (req.method !== 'POST') return reply({error:'Método não permitido.'},405);
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return reply({error:'Inicia sessão para pesquisar jogadores.'},401);
  try {
    const auth = await fetch(Deno.env.get('SUPABASE_URL') + '/auth/v1/user', {headers:{Authorization:authorization,apikey:Deno.env.get('SUPABASE_ANON_KEY')!},signal:AbortSignal.timeout(8000)});
    if (!auth.ok) return reply({error:'A sessão expirou. Volta a entrar.'},401);
    const user = await auth.json();
    if (!user.id || user.is_anonymous) return reply({error:'É necessário iniciar sessão.'},403);
    const now=Date.now(), bucket=requests.get(user.id);
    if (bucket && bucket.reset>now && bucket.count>=30) return reply({error:'Aguarda um minuto antes de pesquisar novamente.'},429);
    requests.set(user.id, bucket && bucket.reset>now ? {...bucket,count:bucket.count+1} : {count:1,reset:now+60000});
    for (const [key,value] of requests) if(value.reset<now) requests.delete(key);
    const body=await req.json().catch(()=>null);
    if (typeof body?.query!=='string') return reply({error:'Escreve o nome de um jogador.'},400);
    const q=normalizeSearch(body.query);
    if(q.length<3 || q.length>60) return reply({error:'Usa entre 3 e 60 caracteres.'},400);
    const key=q.toLowerCase(), hit=cache.get(key);
    if(hit && hit.expires>now) return reply(hit.data);
    const url=new URL('https://www.ea.com/games/ea-sports-fc/ratings');url.searchParams.set('search',q);
    const response=await fetch(url,{headers:{Accept:'text/html'},signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new Error('A pesquisa da EA está temporariamente indisponível. Podes tentar novamente ou adicionar manualmente.');
    const html=await response.text();
    if(html.length>5000000) throw new Error('A fonte devolveu uma resposta inesperada.');
    const data={...parseRatings(html),fetched_at:new Date().toISOString(),edition:'FC 27'};
    for(const [key,value] of cache) if(value.expires<now) cache.delete(key);
    if(cache.size>=100) cache.delete(cache.keys().next().value!);
    cache.set(key,{expires:now+300000,data});return reply(data);
  } catch(e) {
    const message=e instanceof Error && e.name==='TimeoutError' ? 'A EA demorou a responder. Tenta novamente.' : (e instanceof Error ? e.message : 'Não foi possível pesquisar jogadores.');
    return reply({error:message},502);
  }
});
