'use client'
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

export default function Home(){
 const [cat,setCat]=useState('Libre');
 const [categories,setCategories]=useState([]);
 const [data,setData]=useState({teams:[],players:[],matches:[],rounds:[],apps:[],goals:[]});
 async function load(){
  const {data:cs}=await supabase.from('categories').select('*').order('name');
  setCategories(cs||[]);
  const c=(cs||[]).find(x=>x.name===cat)||(cs||[])[0]; if(!c)return;
  if(c.name!==cat) setCat(c.name);
  const [{data:t},{data:p},{data:m},{data:r},{data:a},{data:g}]=await Promise.all([
   supabase.from('teams').select('*').eq('category_id',c.id).order('name'),
   supabase.from('players').select('*').eq('active',true),
   supabase.from('matches').select('*').eq('category_id',c.id).order('match_date'),
   supabase.from('rounds').select('*').eq('category_id',c.id).order('number'),
   supabase.from('player_participation').select('*'),
   supabase.from('goals').select('*')
  ]);
  const ids=new Set((t||[]).map(x=>x.id));
  setData({teams:t||[],players:(p||[]).filter(x=>ids.has(x.team_id)),matches:m||[],rounds:r||[],apps:a||[],goals:g||[]});
 }
 useEffect(()=>{load()},[cat]);
 const stats=useMemo(()=>{
  const s=Object.fromEntries(data.teams.map(t=>[t.id,{...t,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0}]));
  data.matches.filter(m=>m.status==='played').forEach(m=>{const h=s[m.home_team_id],a=s[m.away_team_id];if(!h||!a)return;h.pj++;a.pj++;h.gf+=m.home_score||0;h.gc+=m.away_score||0;a.gf+=m.away_score||0;a.gc+=m.home_score||0;if(m.home_score>m.away_score){h.pg++;a.pp++;h.pts+=3}else if(m.home_score<m.away_score){a.pg++;h.pp++;a.pts+=3}else{h.pe++;a.pe++;h.pts++;a.pts++}});
  return Object.values(s).sort((a,b)=>b.pts-a.pts||((b.gf-b.gc)-(a.gf-a.gc))||b.gf-a.gf||a.name.localeCompare(b.name));
 },[data]);
 const goals=useMemo(()=>{const x={};data.goals.forEach(g=>x[g.player_id]=(x[g.player_id]||0)+1);return data.players.map(p=>({...p,g:x[p.id]||0})).filter(p=>p.g).sort((a,b)=>b.g-a.g||a.name.localeCompare(b.name))},[data]);
 const apps=useMemo(()=>{const x={};data.apps.filter(a=>a.played).forEach(a=>x[a.player_id]=(x[a.player_id]||0)+1);return x},[data]);
 const teamName=id=>data.teams.find(t=>t.id===id)?.name||'—';
 const roundNum=id=>data.rounds.find(r=>r.id===id)?.number||'Pendiente';
 return <>
  <div className="strip">ZOOM EN ACCIÓN • ZOOM EN ACCIÓN • ESTADÍSTICAS OFICIALES • LA ACCIÓN MERECE SER RECORDADA •</div>
  <header className="wrap head"><div className="brand">ZOOM EN <b>ACCIÓN</b></div><a className="btn" href="/admin">⚙ ADMINISTRAR</a></header>
  <main className="wrap"><section className="hero"><div className="eyebrow">TEMPORADA 2026</div><h1>ESTADÍSTICAS<br/>OFICIALES</h1><p>{cat}</p></section>
  <div className="tabs">{categories.map(c=><button key={c.id} onClick={()=>setCat(c.name)} className={'tab '+(cat===c.name?'active':'')}>{c.name.toUpperCase()}</button>)}</div>
  <div className="grid"><div className="card"><div className="title">TABLA GENERAL <small>EN VIVO</small></div><table><thead><tr><th>#</th><th>EQUIPO</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>DG</th><th>PTS</th></tr></thead><tbody>{stats.map((x,i)=><tr key={x.id}><td className="pos">{i+1}</td><td><b>{x.name}</b></td><td>{x.pj}</td><td>{x.pg}</td><td>{x.pe}</td><td>{x.pp}</td><td>{x.gf-x.gc}</td><td><b>{x.pts}</b></td></tr>)}</tbody></table></div>
  <div className="card"><div className="title">TOP GOLEADORES</div>{goals.length?goals.slice(0,10).map((p,i)=><div className="rank" key={p.id}><div className="n">{i+1}</div><div className="info"><b>{p.name}</b><small>{teamName(p.team_id)} • {apps[p.id]||0} PJ</small></div><div className="v">{p.g}</div></div>):<div className="empty">AÚN NO HAY GOLEADORES</div>}</div></div>
  <div className="card" style={{marginTop:18}}><div className="title">PARTIDOS</div>{data.matches.map(m=><div className="match" key={m.id}><small>JORNADA {roundNum(m.round_id)} • {m.status==='played'?'FINALIZADO':'PENDIENTE'}</small><b>{teamName(m.home_team_id)}</b><div className="score">{m.status==='played'?`${m.home_score}-${m.away_score}`:'VS'}</div><b>{teamName(m.away_team_id)}</b></div>)}</div>
  </main></>
}
