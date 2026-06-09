import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapPin, Mic, Camera, Wallet, BookOpen, Utensils, Train, PlusCircle, Smartphone, Sparkles, Heart, Download, Languages, Star } from 'lucide-react';
import './styles.css';

const AUD_TO_JPY = 112.905;
const today = new Date();

const itinerary = [
  { date:'1 Jul 2026', icon:'✈️', title:'Melbourne to Tokyo Narita', location:'Narita International Airport', apple:'Narita International Airport', notes:'Arrival day. Keep it gentle: bags, Suica/IC card, Apple Maps offline check, simple dinner.' },
  { date:'2 Jul 2026', icon:'🍲', title:'Sumo Entertainment Show', location:'Tokyo', apple:'Tokyo Sumo show', notes:'Contact operator for Jase/Ash vegetarian meals. Lexie backup: chips, nuggets, noodles or convenience store basics before/after.' },
  { date:'3 Jul 2026', icon:'🗻', title:'Mount Fuji Full Day Tour', location:'Tokyo Stand T departure point', apple:'Tokyo Station', notes:'8:00 AM departure. Guide info expected around 6 PM the day before. Pack snacks, power bank, jackets and cash.' },
  { date:'4 Jul 2026', icon:'🌈', title:'Free Day Suggestion', location:'TeamLab Planets / Shibuya / Harajuku', apple:'teamLab Planets TOKYO', notes:'Best spare-time pick: TeamLab Planets, then Shibuya Sky or Harajuku/Kiddy Land.' },
  { date:'5 Jul 2026', icon:'🎸', title:'Free Day Suggestion', location:'Ochanomizu / Akihabara / Ueno', apple:'Ochanomizu Station', notes:'Jase: guitar stores. Ash/Lexie: kawaii shops, purikura, arcades, simple food stops.' },
  { date:'6 Jul 2026', icon:'🎀', title:'Sanrio Puroland', location:'Sanrio Puroland, Tama Center', apple:'Sanrio Puroland', notes:'Hello Kitty day. Prioritise parades, character meets, shops, themed desserts and Lexie journal stamps.' },
  { date:'7 Jul 2026', icon:'🏰', title:'Tokyo Disney Resort', location:'Tokyo Disney Resort', apple:'Tokyo Disney Resort', notes:'Full-day booking. Use Apple Maps to Maihama. Lexie-friendly food hunt: fries, popcorn, nuggets/tenders, pizza, ice cream.' },
  { date:'8 Jul 2026', icon:'✈️', title:'Return Travel', location:'Tokyo Narita', apple:'Narita International Airport', notes:'Pack the night before. Keep documents, passports, insurance and chargers together.' }
];

const places = [
  { name:'Tokyo Disney Resort', type:'booking', emoji:'🏰', prompts:['Favourite ride?', 'Best snack?', 'Best character or photo spot?', 'Did the fireworks sparkle enough?'], lexieFood:['French fries', 'Popcorn', 'Ice cream', 'Pizza', 'Chicken tenders/nuggets if available'] },
  { name:'Sanrio Puroland', type:'booking', emoji:'🎀', prompts:['Favourite Sanrio character?', 'Best shop?', 'Favourite cute dessert?', 'What did you buy or want to buy?'], lexieFood:['Desserts', 'Ice cream', 'Pizza-style options', 'Plain bakery snacks'] },
  { name:'Mount Fuji', type:'booking', emoji:'🗻', prompts:['First reaction seeing Fuji?', 'Best photo?', 'Weather today?', 'What did the mountain look like?'], lexieFood:['Bring backup snacks', 'Plain noodles where available', 'Chips/snacks from convenience stores'] },
  { name:'Sumo Show', type:'booking', emoji:'🍲', prompts:['What was the coolest sumo move?', 'What did the ring ceremony look like?', 'Best photo or video?'], lexieFood:['Eat before if hot pot is not suitable', 'Look for nuggets/chips/noodles nearby'] },
  { name:'Harajuku', type:'spare time', emoji:'🌸', prompts:['Cutest thing seen?', 'Best shop?', 'Best photo booth?', 'Favourite sweet treat?'], lexieFood:['McDonald’s/KFC style backup', 'Crepes without sauce', 'Plain chips', 'Ice cream'] },
  { name:'Ochanomizu Guitar Street', type:'spare time', emoji:'🎸', prompts:['Best guitar seen?', 'Favourite shop?', 'Did Jase find treasure?'], lexieFood:['Nearby convenience store basics', 'Simple bakery food'] }
];

const phrases = [
  ['Vegetarian', '私はベジタリアンです。', 'Watashi wa bejitarian desu.'],
  ['No meat or fish', '肉と魚は食べられません。', 'Niku to sakana wa taberaremasen.'],
  ['No fish stock', '魚のだしは入っていますか？', 'Sakana no dashi wa haitteimasu ka?'],
  ['Plain noodles please', '具なしの麺をお願いします。', 'Gu nashi no men o onegaishimasu.'],
  ['Plain pasta, no sauce', 'ソースなしのプレーンパスタをお願いします。', 'Sōsu nashi no purēn pasuta o onegaishimasu.'],
  ['Chicken nuggets?', 'チキンナゲットはありますか？', 'Chikin nagetto wa arimasu ka?'],
  ['Hot chips?', 'フライドポテトはありますか？', 'Furaido poteto wa arimasu ka?'],
  ['Which platform?', '何番線ですか？', 'Nanbansen desu ka?'],
  ['Please help me', '助けてください。', 'Tasukete kudasai.']
];

function useLocal(key, initial){
  const [value,setValue] = useState(()=>{ try { return JSON.parse(localStorage.getItem(key)) ?? initial } catch { return initial }});
  useEffect(()=>localStorage.setItem(key, JSON.stringify(value)),[key,value]);
  return [value,setValue];
}

function say(text){
  if(!('speechSynthesis' in window)) return alert('Speech is not available on this device/browser.');
  const u = new SpeechSynthesisUtterance(text); u.lang='ja-JP'; speechSynthesis.speak(u);
}

function appleMaps(query){
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function App(){
  const [tab,setTab] = useState('home');
  const [entries,setEntries] = useLocal('lexie-journal', []);
  const [notes,setNotes] = useLocal('shared-notes', []);
  const [aud,setAud] = useState(50); const [jpy,setJpy] = useState(Math.round(50*AUD_TO_JPY));
  const nextTrip = Math.ceil((new Date('2026-07-01T09:00:00')-today)/(1000*60*60*24));
  const tabs = [['home','Home','🎀'],['itinerary','Trip','🗓️'],['maps','Apple Maps','🗺️'],['journal','Lexie Journal','📖'],['food','Food','🍟'],['translate','Translator','🎤'],['money','Currency','💴'],['phone','Apple Devices','📱'],['add','Add Info','➕']];
  return <div className="app">
    <div className="sakura"></div><div className="bows"></div>
    <header><div className="kitty">🎀</div><div><h1>Ash, Jase & Lexie's Excellent Adventure</h1><p>Hello Kitty inspired Japan companion, offline-first for iPhone/iPad</p></div></header>
    <nav>{tabs.map(t=><button key={t[0]} onClick={()=>setTab(t[0])} className={tab===t[0]?'active':''}><span>{t[2]}</span>{t[1]}</button>)}</nav>
    <main>
      {tab==='home' && <section className="grid"><Card title="Tokyo Countdown" icon={<Sparkles/>}><div className="big">{nextTrip>0?nextTrip:'Trip time!'} days</div><p>Pack passports, insurance, chargers, Apple Maps offline areas and Lexie's snack backup.</p></Card><Card title="Today’s Travel Brain" icon={<Heart/>}><p>Use the itinerary pages for Apple Maps buttons, vegetarian notes, Lexie food options, and journal prompts.</p><div className="stampRow"><span>✈️</span><span>🍲</span><span>🗻</span><span>🎀</span><span>🏰</span></div></Card><Card title="Booking Wallet" icon={<Download/>}><a href="/assets/Qantas_E_Ticket_DQ3AT8.pdf">Open Qantas e-ticket PDF</a><a href="/assets/Tokyo_Meeting_Point.jpg">Open Fuji meeting point image</a></Card></section>}
      {tab==='itinerary' && <Timeline />}
      {tab==='maps' && <Maps />}
      {tab==='journal' && <Journal entries={entries} setEntries={setEntries} />}
      {tab==='food' && <Food />}
      {tab==='translate' && <Translator />}
      {tab==='money' && <Currency aud={aud} setAud={setAud} jpy={jpy} setJpy={setJpy} />}
      {tab==='phone' && <Phone />}
      {tab==='add' && <AddInfo notes={notes} setNotes={setNotes} />}
    </main>
  </div>
}
function Card({title,icon,children}){return <article className="card"><h2>{icon}{title}</h2>{children}</article>}
function Timeline(){return <section className="timeline">{itinerary.map((i,idx)=><article className="event" key={i.title}><div className="date">{i.date}</div><div className="bubble">{i.icon}</div><div><h2>{i.title}</h2><p><MapPin size={16}/> {i.location}</p><p>{i.notes}</p><a className="pill" href={appleMaps(i.apple)} target="_blank">Open in Apple Maps</a></div></article>)}</section>}
function Maps(){return <section className="grid"><Card title="Apple Maps Setup" icon={<MapPin/>}><ol><li>Open Apple Maps before the trip.</li><li>Search Tokyo and choose Download Map.</li><li>Also download Narita, Maihama/Disney, Tama Center/Puroland and Mount Fuji/Kawaguchiko.</li><li>Save hotel, airport, Disney, Puroland and Fuji meeting point as favourites.</li></ol></Card>{itinerary.filter(x=>x.apple).map(i=><Card key={i.title} title={i.title} icon={<Train/>}><p>{i.location}</p><a className="pill" target="_blank" href={appleMaps(i.apple)}>Navigate with Apple Maps</a><p className="tiny">Offline maps are managed inside Apple Maps, not bundled in this app.</p></Card>)}</section>}
function Journal({entries,setEntries}){const [place,setPlace]=useState(places[0].name); const [mood,setMood]=useState('😊 Happy'); const [text,setText]=useState(''); const current=places.find(p=>p.name===place); function add(){setEntries([{id:Date.now(),place,mood,text,date:new Date().toLocaleString(),emoji:current.emoji},...entries]); setText('')} return <section className="grid"><Card title="Lexie’s Location-Aware Journal" icon={<BookOpen/>}><label>Where are you?</label><select value={place} onChange={e=>setPlace(e.target.value)}>{places.map(p=><option>{p.name}</option>)}</select><div className="placeHero">{current.emoji} {current.name}</div><p>Prompts:</p><ul>{current.prompts.map(p=><li>{p}</li>)}</ul><label>Mood</label><select value={mood} onChange={e=>setMood(e.target.value)}><option>😊 Happy</option><option>😍 Excited</option><option>😮 Amazed</option><option>🥰 Loved it</option><option>😴 Tired</option></select><textarea placeholder="Lexie's memory, or Jase/Ash can type it for her..." value={text} onChange={e=>setText(e.target.value)} /><button onClick={add}>Add journal stamp</button></Card><Card title="Treasure Hunt" icon={<Star/>}><ul className="hunt"><li>📸 Find Hello Kitty</li><li>🚆 Ride a Tokyo train</li><li>🍦 Try Japanese ice cream</li><li>🏰 Find Mickey</li><li>🗻 Spot Mount Fuji</li><li>🎀 Take a cute shop photo</li></ul></Card><Card title="Journal Entries" icon={<Sparkles/>}>{entries.length===0?<p>No entries yet.</p>:entries.map(e=><div className="note" key={e.id}><b>{e.emoji} {e.place}</b><small>{e.date} · {e.mood}</small><p>{e.text || 'Quick stamp added.'}</p></div>)}</Card></section>}
function Food(){return <section className="grid"><Card title="Jase & Ash Vegetarian Mode" icon={<Utensils/>}><p>Watch for hidden dashi, fish stock, chicken broth and meat extracts.</p><ul><li>T’s TanTan near Tokyo Station</li><li>Ain Soph locations</li><li>Vegetarian curry where confirmed</li><li>Carry snacks for Fuji and Sumo days</li></ul></Card><Card title="Lexie Plain-Food Mode" icon={<Utensils/>}><p>Lexie is not vegetarian. She likes basic food with no sauce or strong flavours.</p><ul><li>Chicken nuggets</li><li>Hot chips/fries</li><li>Chicken noodles</li><li>Plain pasta with no sauce</li><li>Pizza, toast, ice cream, pancakes</li></ul></Card>{places.map(p=><Card key={p.name} title={`${p.emoji} ${p.name}`} icon={<MapPin/>}><p><b>Lexie-friendly ideas:</b></p><ul>{p.lexieFood.map(f=><li>{f}</li>)}</ul><a className="pill" target="_blank" href={appleMaps(`${p.name} McDonald's KFC fries noodles`) }>Find simple food nearby</a></Card>)}</section>}
function Translator(){return <section className="grid"><Card title="Voice Translator" icon={<Mic/>}><p>Tap a phrase to speak it in Japanese. Works best online, but saved phrase cards work offline.</p>{phrases.map(([en,ja,ro])=><button className="phrase" onClick={()=>say(ja)}><b>{en}</b><span>{ja}</span><small>{ro}</small></button>)}</Card><Card title="Visual Translator Helper" icon={<Camera/>}><p>Offline camera translation cannot be fully built into a small web app. Use this workflow:</p><ol><li>Open Apple Translate or Google Translate app.</li><li>Download Japanese offline language pack before leaving.</li><li>Use camera mode on menus, signs and tickets.</li></ol><p>This app stores translated notes in Add Info.</p></Card></section>}
function Currency({aud,setAud,jpy,setJpy}){return <section className="grid"><Card title="Offline AUD ⇄ JPY Converter" icon={<Wallet/>}><p>Last known rate: 1 AUD ≈ ¥{AUD_TO_JPY.toFixed(3)} JPY.</p><label>AUD</label><input type="number" value={aud} onChange={e=>{const v=Number(e.target.value); setAud(v); setJpy(Math.round(v*AUD_TO_JPY))}}/><label>JPY</label><input type="number" value={jpy} onChange={e=>{const v=Number(e.target.value); setJpy(v); setAud((v/AUD_TO_JPY).toFixed(2))}}/><p className="big">${aud} ≈ ¥{Number(jpy).toLocaleString()}</p></Card></section>}
function Phone(){return <section className="grid"><Card title="Access on iPhone/iPad" icon={<Smartphone/>}><ol><li>Deploy this repo to Vercel.</li><li>Open the Vercel link in Safari.</li><li>Tap Share.</li><li>Tap Add to Home Screen.</li><li>Open it from the new icon.</li></ol></Card><Card title="ALDI Prepaid SIM Notes" icon={<Smartphone/>}><ul><li>Turn on international roaming before leaving Australia.</li><li>Expect mobile data to cost more overseas.</li><li>Use hotel Wi-Fi where possible.</li><li>Download Apple Maps offline areas and translator language packs before departure.</li><li>Keep screenshots/PDFs of tickets in Apple Files and Photos as backup.</li></ul></Card></section>}
function AddInfo({notes,setNotes}){const [title,setTitle]=useState(''); const [body,setBody]=useState(''); function add(){if(!title&&!body)return; setNotes([{id:Date.now(),title,body,date:new Date().toLocaleString()},...notes]); setTitle(''); setBody('')} return <section className="grid"><Card title="Add New Information" icon={<PlusCircle/>}><input placeholder="Title, booking, restaurant, reminder..." value={title} onChange={e=>setTitle(e.target.value)}/><textarea placeholder="Paste details, translated text, notes, reminders or travel tips..." value={body} onChange={e=>setBody(e.target.value)}/><button onClick={add}>Save offline</button><p className="tiny">Saved to this device. Firebase syncing can be added later using the Happy Little Bubbies pattern.</p></Card><Card title="Saved Notes" icon={<BookOpen/>}>{notes.length===0?<p>No notes yet.</p>:notes.map(n=><div className="note"><b>{n.title}</b><small>{n.date}</small><p>{n.body}</p></div>)}</Card></section>}

createRoot(document.getElementById('root')).render(<App/>);

if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{})); }
