
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  MapPin, Mic, Camera, Wallet, BookOpen, Utensils, Train, PlusCircle,
  Smartphone, Sparkles, Heart, Download, Star, Shield, CheckSquare,
  GraduationCap, Palette, Image as ImageIcon, Phone as PhoneIcon, FileText, Trophy,
  Home, Users, Route, Gift, RefreshCw, Upload, Save, Eraser
} from 'lucide-react';
import './styles.css';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDmlH6crdNzfmEO-vr-zLr3KOjp857HN60",
  authDomain: "ajl-japan-adventure.firebaseapp.com",
  projectId: "ajl-japan-adventure",
  storageBucket: "ajl-japan-adventure.firebasestorage.app",
  messagingSenderId: "241722632776",
  appId: "1:241722632776:web:0a7b4ec866641bfd78467d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const AUD_TO_JPY = 112.905;
const today = new Date();
const HOTEL = {
  name: 'APA Hotel & Resort Tokyo Bay Shiomi',
  address: '2-8-6 Shiomi, Koto-ku, Tokyo',
  apple: 'APA Hotel & Resort Tokyo Bay Shiomi'
};

const docs = {
  qantas: { label:'Qantas E-ticket', url:'/assets/Qantas_E_Ticket_DQ3AT8.pdf' },
  fujiMeeting: { label:'Fuji Meeting Point Image', url:'/assets/Tokyo_Meeting_Point.jpg' },
  appleMaps: { label:'Apple Maps Offline Setup', url:'#apple-maps-setup' },
  insurance: { label:'Travel Insurance Policy', url:'#insurance' },
  hotel: { label:'Hotel Details', url:'#hotel' },
  emergency: { label:'Emergency Hub', url:'#emergency' }
};

const itinerary = [
  { day: 'Pre Travel', date:'Before 1 Jul', icon:'🎒', title:'Get Ready for Japan', location:'Home', apple:HOTEL.apple, notes:'Download maps, translator packs, tickets, phrases and comfort plan.', kind:'prep' },
  { day: 'Day 1', date:'1 Jul 2026', icon:'✈️', title:'Melbourne to Tokyo Narita', location:'Narita International Airport', apple:'Narita International Airport', notes:'Arrival day. Bags, Suica/IC card, Apple Maps offline check, simple dinner.', kind:'booking' },
  { day: 'Day 2', date:'2 Jul 2026', icon:'🍲', title:'Sumo Entertainment Show', location:'Tokyo', apple:'Tokyo Sumo show', notes:'Contact operator for Dad/Mum vegetarian meals. Lexie backup: chips, nuggets, noodles or convenience store basics.', kind:'booking' },
  { day: 'Day 3', date:'3 Jul 2026', icon:'🗻', title:'Mount Fuji Full Day Tour', location:'Tokyo Stand T departure point', apple:'Tokyo Station', notes:'8:00 AM departure. Guide info expected around 6 PM the day before. Pack snacks, power bank, jackets and cash.', kind:'booking' },
  { day: 'Day 4', date:'4 Jul 2026', icon:'🌈', title:'Free Day: TeamLab / Shibuya / Harajuku', location:'TeamLab Planets / Shibuya / Harajuku', apple:'teamLab Planets TOKYO', notes:'Lonely Planet-style family pick: interactive, bright, memorable experiences over long passive sightseeing.', kind:'spare' },
  { day: 'Day 5', date:'5 Jul 2026', icon:'🎸', title:'Free Day: Guitar Street / Akihabara / Ueno', location:'Ochanomizu / Akihabara / Ueno', apple:'Ochanomizu Station', notes:'Dad: guitar stores. Mum/Lexie: kawaii shops, purikura, arcades, simple food stops.', kind:'spare' },
  { day: 'Day 6', date:'6 Jul 2026', icon:'🎀', title:'Sanrio Puroland', location:'Sanrio Puroland, Tama Center', apple:'Sanrio Puroland', notes:'Hello Kitty day. Parades, character meets, shops, desserts and journal stamps.', kind:'booking' },
  { day: 'Day 7', date:'7 Jul 2026', icon:'🏰', title:'Tokyo Disney Resort', location:'Tokyo Disney Resort', apple:'Tokyo Disney Resort', notes:'Full-day booking. Use Apple Maps to Maihama. Lexie-friendly food hunt: fries, popcorn, nuggets/tenders, pizza, ice cream.', kind:'booking' },
  { day: 'Day 8', date:'8 Jul 2026', icon:'✈️', title:'Return Travel', location:'Tokyo Narita', apple:'Narita International Airport', notes:'Pack the night before. Keep documents, passports, insurance and chargers together.', kind:'booking' }
];

const routeCards = [
  {
    id:'disney',
    title:'Hotel ⇄ Tokyo Disney Resort',
    icon:'🏰',
    destination:'Tokyo Disney Resort',
    outbound:[
      'Start: APA Hotel & Resort Tokyo Bay Shiomi',
      'Walk to Shiomi Station',
      'Take JR Keiyo Line toward Maihama / Soga',
      'Arrive Maihama Station',
      'Walk or use Disney Resort Line depending on park entry'
    ],
    return:[
      'Start: Tokyo Disney Resort / Maihama Station',
      'Take JR Keiyo Line toward Tokyo',
      'Exit at Shiomi Station',
      'Walk back to hotel'
    ],
    live:'Tokyo Disney Resort from APA Hotel & Resort Tokyo Bay Shiomi by train',
    notes:'Platforms and exact departures should be checked live in Apple Maps on the day.'
  },
  {
    id:'puroland',
    title:'Hotel ⇄ Sanrio Puroland',
    icon:'🎀',
    destination:'Sanrio Puroland',
    outbound:[
      'Start: APA Hotel & Resort Tokyo Bay Shiomi',
      'Use Apple Maps live route to Tama-Center Station',
      'Expect JR/Metro plus Keio/Odakyu connections',
      'Walk to Sanrio Puroland'
    ],
    return:[
      'Start: Sanrio Puroland',
      'Walk to Tama-Center Station',
      'Use Apple Maps live route back to Shiomi',
      'Walk to hotel'
    ],
    live:'Sanrio Puroland from APA Hotel & Resort Tokyo Bay Shiomi by train',
    notes:'This is a longer cross-city trip. Check live trains and platforms the night before and again before leaving.'
  },
  {
    id:'fuji',
    title:'Hotel ⇄ Fuji Tour Meeting Point',
    icon:'🗻',
    destination:'Tokyo Station / Stand T',
    outbound:[
      'Leave early from APA Hotel & Resort Tokyo Bay Shiomi',
      'Use Apple Maps live route to Tokyo Station / selected Stand T meeting area',
      'Arrive at least 30 minutes early',
      'Check guide email around 6 PM the day before'
    ],
    return:[
      'Tour returns to Tokyo area',
      'Use Apple Maps live route from drop-off point to Shiomi',
      'Keep snacks and battery available for the return'
    ],
    live:'Tokyo Station from APA Hotel & Resort Tokyo Bay Shiomi by train',
    notes:'Departure is 8:00 AM. App should remind the family the day before and early morning.'
  },
  {
    id:'sumo',
    title:'Hotel ⇄ Sumo Entertainment Show',
    icon:'🍲',
    destination:'Tokyo Sumo show',
    outbound:[
      'Start at APA Hotel & Resort Tokyo Bay Shiomi',
      'Use Apple Maps live route to the venue once final venue details are confirmed',
      'Eat vegetarian/plain-food backup before if needed',
      'Arrive 30 minutes early'
    ],
    return:[
      'Use Apple Maps live route from venue back to Shiomi',
      'Save venue location before leaving the hotel'
    ],
    live:'Tokyo Sumo show from APA Hotel & Resort Tokyo Bay Shiomi by train',
    notes:'Contact operator for vegetarian meal options. Hot pot may not suit Dad/Mum or Lexie.'
  },
  {
    id:'narita',
    title:'Hotel ⇄ Narita Airport',
    icon:'✈️',
    destination:'Narita International Airport',
    outbound:[
      'For return day, start at APA Hotel & Resort Tokyo Bay Shiomi',
      'Use Apple Maps live route to Narita Airport',
      'Check flight time, bags and passports',
      'Allow generous transfer time'
    ],
    return:[
      'Arrival day: Narita Airport to hotel',
      'Use Apple Maps or airport rail/bus guidance after landing',
      'Keep the first night simple'
    ],
    live:'Narita International Airport from APA Hotel & Resort Tokyo Bay Shiomi',
    notes:'Airport routes depend heavily on baggage, arrival terminal and family energy.'
  }
];

const defaultReminders = [
  { id:'r1', title:'Check passports for Dad, Mum and Lexie', due:'Pre Travel', linkLabel:'Emergency Hub', link:'#emergency', group:'Documents' },
  { id:'r2', title:'Download Apple Maps offline areas: Tokyo, Narita, Disney, Puroland, Fuji', due:'Pre Travel', linkLabel:'Apple Maps setup', link:'#apple-maps-setup', group:'Phone' },
  { id:'r3', title:'Download Japanese offline translation pack', due:'Pre Travel', linkLabel:'Japanese phrases', link:'#phrases', group:'Phone' },
  { id:'r4', title:'Pack Lexie plain-food backup snacks', due:'Pre Travel', linkLabel:'Lexie Food Mode', link:'#food', group:'Lexie' },
  { id:'r5', title:'Practise 5 Japanese phrases with Lexie', due:'Pre Travel', linkLabel:'Japanese Learning', link:'#phrases', group:'Lexie Rewards' },
  { id:'r6', title:'Open Qantas e-ticket before airport', due:'1 Jul 2026', linkLabel:'Open Qantas e-ticket', link:'/assets/Qantas_E_Ticket_DQ3AT8.pdf', group:'Flights' },
  { id:'r7', title:'Confirm vegetarian meals for Sumo Show', due:'Before 2 Jul 2026', linkLabel:'Sumo route/card', link:'#route-sumo', group:'Food' },
  { id:'r8', title:'Check Fuji guide email around 6 PM', due:'2 Jul 2026', linkLabel:'Fuji meeting image', link:'/assets/Tokyo_Meeting_Point.jpg', group:'Tours' },
  { id:'r9', title:'Leave hotel early for Fuji meeting point', due:'3 Jul 2026', linkLabel:'Fuji route', link:'#route-fuji', group:'Routes' },
  { id:'r10', title:'Plan Lexie simple food backup for Disney', due:'7 Jul 2026', linkLabel:'Disney food', link:'#food', group:'Lexie' }
];

const japaneseLessons = [
  { id:'jp1', en:'Hello', ja:'こんにちは', romaji:'Konnichiwa', category:'Basics' },
  { id:'jp2', en:'Thank you', ja:'ありがとう', romaji:'Arigatou', category:'Basics' },
  { id:'jp3', en:'Excuse me / sorry', ja:'すみません', romaji:'Sumimasen', category:'Basics' },
  { id:'jp4', en:'Please', ja:'お願いします', romaji:'Onegaishimasu', category:'Basics' },
  { id:'jp5', en:'How much is it?', ja:'いくらですか？', romaji:'Ikura desu ka?', category:'Shopping' },
  { id:'jp6', en:'Where is the toilet?', ja:'トイレはどこですか？', romaji:'Toire wa doko desu ka?', category:'Travel' },
  { id:'jp7', en:'Which platform?', ja:'何番線ですか？', romaji:'Nanbansen desu ka?', category:'Train' },
  { id:'jp8', en:'Plain pasta, no sauce please', ja:'ソースなしのプレーンパスタをお願いします。', romaji:'Sōsu nashi no purēn pasuta o onegaishimasu.', category:'Food' },
  { id:'jp9', en:'Do you have chicken nuggets?', ja:'チキンナゲットはありますか？', romaji:'Chikin nagetto wa arimasu ka?', category:'Food' },
  { id:'jp10', en:'I am vegetarian', ja:'私はベジタリアンです。', romaji:'Watashi wa bejitarian desu.', category:'Food' }
];

const discoveryIdeas = [
  { title:'Odaiba Explorer', emoji:'🎡', why:'Bright waterfront, malls, robots, big views and easy breaks.', challenge:'Find a giant statue or rainbow bridge view.' },
  { title:'Tokyo Character Street', emoji:'🛍️', why:'Great for Sanrio, Disney, anime and character shopping without a long outdoor walk.', challenge:'Find one character Dad knows and one character Lexie knows.' },
  { title:'Tokyo Skytree / Solamachi', emoji:'🗼', why:'Big views plus shopping and food courts, useful if weather is clear.', challenge:'Count how many trains you can see from above.' },
  { title:'Aquarium / Indoor backup', emoji:'🐠', why:'Good wet-weather or tired-day option.', challenge:'Pick the cutest sea creature and draw it later.' },
  { title:'Harajuku Kawaii Walk', emoji:'🌸', why:'Colourful shops, photo booths and fun little treats.', challenge:'Find something shaped like a bow, cat or star.' }
];

const lexiePages = [
  {
    id:'pre',
    label:'Pre Travel',
    title:'Before We Go',
    emoji:'🎒',
    prompts:[
      'What are you most looking forward to?',
      'Why are you looking forward to it?',
      'What do you think Japan will feel like?',
      'Is there anything you are worried about?',
      'What could Mum or Dad do to help?',
      'What is one brave thing you can try before we leave?'
    ]
  },
  ...itinerary.filter(x=>x.day !== 'Pre Travel').map((item, idx)=>({
    id:`day-${idx+1}`,
    label:item.day,
    title:item.title,
    emoji:item.icon,
    prompts:[
      'What was the best part?',
      'Why did you like it?',
      'What made you smile?',
      'What did you learn?',
      'What would you draw from today?',
      'What photo do you want to keep forever?'
    ]
  }))
];

function appleMaps(query){ return `https://maps.apple.com/?q=${encodeURIComponent(query)}`; }
function appleRoute(query){ return `https://maps.apple.com/?saddr=${encodeURIComponent(HOTEL.name)}&daddr=${encodeURIComponent(query)}&dirflg=r`; }
function speak(text){
  if(!('speechSynthesis' in window)) return alert('Speech is not available on this browser.');
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  window.speechSynthesis.speak(u);
}
function dateKey(){ return new Date().toISOString().slice(0,10); }

function useLocal(key, initial){
  const [value,setValue] = useState(()=>{ try { return JSON.parse(localStorage.getItem(key)) ?? initial } catch { return initial }});
  useEffect(()=>localStorage.setItem(key, JSON.stringify(value)),[key,value]);
  return [value,setValue];
}

function useFirebaseCollection(name, fallback = []){
  const [items,setItems] = useLocal(`offline-${name}`, fallback);
  const [ready,setReady] = useState(false);
  useEffect(()=>{
    let unsubAuth = onAuthStateChanged(auth, user=>{
      if(!user) return;
      const q = query(collection(db, name), orderBy('createdAt','desc'));
      const unsub = onSnapshot(q, snap=>{
        const rows = snap.docs.map(d=>({ id:d.id, ...d.data() }));
        setItems(rows);
        setReady(true);
      }, err=>{ console.warn(name, err); setReady(false); });
      return unsub;
    });
    signInAnonymously(auth).catch(err=>console.warn('Anonymous auth failed', err));
    return ()=>unsubAuth && unsubAuth();
  },[name]);
  async function add(data){
    const payload = { ...data, createdAt: serverTimestamp(), deviceDate: new Date().toISOString() };
    try { await addDoc(collection(db, name), payload); }
    catch { setItems(prev=>[{ id:`local-${Date.now()}`, ...payload, createdAt:null }, ...prev]); }
  }
  async function update(id, data){
    if(!id || String(id).startsWith('local-')) {
      setItems(prev=>prev.map(x=>x.id===id?{...x,...data}:x));
      return;
    }
    await updateDoc(doc(db, name, id), data).catch(()=>{});
  }
  async function remove(id){
    if(!id || String(id).startsWith('local-')) {
      setItems(prev=>prev.filter(x=>x.id!==id));
      return;
    }
    await deleteDoc(doc(db, name, id)).catch(()=>{});
  }
  return { items, add, update, remove, ready };
}

async function uploadFile(file, folder='uploads'){
  const safe = file.name.replace(/[^\w.\-]+/g,'_');
  const path = `${folder}/${Date.now()}-${safe}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path, name:file.name, type:file.type };
}

function App(){
  const [tab,setTab] = useState('home');
  const reminders = useFirebaseCollection('reminders', defaultReminders);
  const notes = useFirebaseCollection('tripNotes', []);
  const journal = useFirebaseCollection('journalEntries', []);
  const rewards = useFirebaseCollection('rewards', []);
  const photos = useFirebaseCollection('photos', []);
  const drawings = useFirebaseCollection('drawings', []);
  const lessons = useFirebaseCollection('japaneseLessonProgress', []);
  const [aud,setAud] = useState(50);
  const [jpy,setJpy] = useState(Math.round(50*AUD_TO_JPY));
  const nextTrip = Math.ceil((new Date('2026-07-01T09:00:00')-today)/(1000*60*60*24));
  const allCollectionsReady = reminders.ready || notes.ready || journal.ready;

  const tabs = [
    ['home','Home','🎀'],['reminders','Reminders','✅'],['routes','Routes','🚆'],
    ['journal','Lexie Journal','📖'],['learn','Japanese','🇯🇵'],['rewards','Rewards','⭐'],
    ['photos','Photos','📷'],['emergency','Emergency','🚨'],['food','Food','🍟'],
    ['money','Currency','💴'],['phone','Apple Devices','📱'],['add','Add Info','➕']
  ];

  return <div className="app">
    <div className="sakura"></div><div className="bows"></div>
    <header>
      <div className="kitty">🎀</div>
      <div>
        <h1>Ash, Jase & Lexie's Excellent Adventure</h1>
        <p>Dad, Mum and Lexie's shared Japan adventure book</p>
        <small className={allCollectionsReady?'sync online':'sync'}>{allCollectionsReady?'Firebase sync ready':'Offline/local mode until sync connects'}</small>
      </div>
    </header>
    <nav>{tabs.map(t=><button key={t[0]} onClick={()=>setTab(t[0])} className={tab===t[0]?'active':''}><span>{t[2]}</span>{t[1]}</button>)}</nav>
    <main>
      {tab==='home' && <HomePage nextTrip={nextTrip} reminders={reminders} journal={journal} rewards={rewards} />}
      {tab==='reminders' && <Reminders data={reminders} />}
      {tab==='routes' && <Routes />}
      {tab==='journal' && <LexieJournal journal={journal} rewards={rewards} photos={photos} drawings={drawings} />}
      {tab==='learn' && <JapaneseLearning progress={lessons} rewards={rewards} />}
      {tab==='rewards' && <Rewards rewards={rewards} />}
      {tab==='photos' && <Photos photos={photos} />}
      {tab==='emergency' && <Emergency />}
      {tab==='food' && <Food />}
      {tab==='money' && <Currency aud={aud} setAud={setAud} jpy={jpy} setJpy={setJpy} />}
      {tab==='phone' && <Phone />}
      {tab==='add' && <AddInfo notes={notes} />}
    </main>
  </div>
}

function Card({title,icon,children,id}){return <article className="card" id={id}><h2>{icon}{title}</h2>{children}</article>}

function HomePage({nextTrip, reminders, journal, rewards}){
  const todayStars = rewards.items.filter(r=>r.day===dateKey()).reduce((a,b)=>a+(b.stars||1),0);
  const undone = reminders.items.filter(r=>!r.done).slice(0,5);
  return <section className="grid">
    <Card title="Tokyo Countdown" icon={<Sparkles/>}><div className="big">{nextTrip>0?nextTrip:'Trip time!'} days</div><p>One app for Dad, Mum and Lexie: routes, reminders, journal, photos, rewards and emergency help.</p></Card>
    <Card title="Today's Control Centre" icon={<Home/>}><p><b>Hotel:</b> {HOTEL.name}</p><p>{HOTEL.address}</p><a className="pill" href={appleMaps(HOTEL.apple)} target="_blank">Open hotel in Apple Maps</a></Card>
    <Card title="Lexie's Stars Today" icon={<Trophy/>}><div className="stars">{Array.from({length:5}).map((_,i)=><span className={i<todayStars?'won':''}>⭐</span>)}</div><p>{Math.min(todayStars,5)}/5 easy daily stars earned.</p></Card>
    <Card title="Next Smart Reminders" icon={<CheckSquare/>}>{undone.length?undone.map(r=><div className="mini" key={r.id}>☐ {r.title}<small>{r.due}</small></div>):<p>All reminders ticked. Tiny confetti goblin approves.</p>}</Card>
    <Card title="Booking Wallet" icon={<Download/>}><a href="/assets/Qantas_E_Ticket_DQ3AT8.pdf">Open Qantas e-ticket PDF</a><a href="/assets/Tokyo_Meeting_Point.jpg">Open Fuji meeting point image</a></Card>
    <Card title="Lonely Planet Inspired Ideas" icon={<Sparkles/>}>{discoveryIdeas.slice(0,3).map(x=><div className="mini"><b>{x.emoji} {x.title}</b><p>{x.why}</p><small>{x.challenge}</small></div>)}</Card>
  </section>
}

function Reminders({data}){
  const [title,setTitle]=useState('');
  const [due,setDue]=useState('');
  const [link,setLink]=useState('');
  const [linkLabel,setLinkLabel]=useState('');
  async function addReminder(){
    if(!title.trim()) return;
    await data.add({title, due:due||'Custom', link, linkLabel:linkLabel||'Open link', done:false, group:'Custom'});
    setTitle(''); setDue(''); setLink(''); setLinkLabel('');
  }
  const items = data.items.length ? data.items : defaultReminders;
  return <section className="grid">
    <Card title="Smart Reminders with Links" icon={<CheckSquare/>}>
      <p>Tick boxes sync between Dad, Mum and Lexie. Relevant reminders open documents, routes or instructions.</p>
      {items.map(r=><div className={r.done?'reminder done':'reminder'} key={r.id}>
        <label><input type="checkbox" checked={!!r.done} onChange={e=>data.update(r.id,{done:e.target.checked, doneAt:e.target.checked?new Date().toISOString():null})}/><span>{r.title}</span></label>
        <small>{r.group || 'Trip'} · {r.due}</small>
        {r.link && <a className="pill small" href={r.link} target={r.link.startsWith('#')?'_self':'_blank'}>{r.linkLabel || 'Open linked item'}</a>}
      </div>)}
    </Card>
    <Card title="Add Reminder" icon={<PlusCircle/>}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Reminder item"/>
      <input value={due} onChange={e=>setDue(e.target.value)} placeholder="Due date or day"/>
      <input value={linkLabel} onChange={e=>setLinkLabel(e.target.value)} placeholder="Link label, e.g. Open ticket"/>
      <input value={link} onChange={e=>setLink(e.target.value)} placeholder="Document URL, route #route-disney, or Apple Maps link"/>
      <button onClick={addReminder}>Add synced reminder</button>
    </Card>
  </section>
}

function Routes(){
  return <section className="grid" id="routes">
    <Card title="Route Rule" icon={<Route/>}><p>The app stores hotel-first route cards. Exact train platforms and departure times should be checked live in Apple Maps on the day because platforms and disruptions can change.</p><a className="pill" href={appleRoute('Tokyo Station')} target="_blank">Test live route from hotel</a></Card>
    {routeCards.map(r=><Card key={r.id} id={`route-${r.id}`} title={`${r.icon} ${r.title}`} icon={<Train/>}>
      <h3>Hotel → Destination</h3><ol>{r.outbound.map(step=><li>{step}</li>)}</ol>
      <a className="pill" href={appleRoute(r.destination)} target="_blank">Open live Apple Maps route</a>
      <h3>Destination → Hotel</h3><ol>{r.return.map(step=><li>{step}</li>)}</ol>
      <a className="pill" href={`https://maps.apple.com/?saddr=${encodeURIComponent(r.destination)}&daddr=${encodeURIComponent(HOTEL.name)}&dirflg=r`} target="_blank">Open return route</a>
      <p className="tiny">{r.notes}</p>
      <RouteTimingEditor routeId={r.id}/>
    </Card>)}
  </section>
}
function RouteTimingEditor({routeId}){
  const routeTimes = useFirebaseCollection(`routeTimes_${routeId}`, []);
  const [departure,setDeparture]=useState('');
  const [arrival,setArrival]=useState('');
  const [platform,setPlatform]=useState('');
  async function save(){ await routeTimes.add({departure, arrival, platform}); setDeparture(''); setArrival(''); setPlatform('');}
  return <div className="routeEdit">
    <h4>Save live times after checking Apple Maps</h4>
    <input placeholder="Departure time" value={departure} onChange={e=>setDeparture(e.target.value)}/>
    <input placeholder="Arrival time" value={arrival} onChange={e=>setArrival(e.target.value)}/>
    <input placeholder="Platform / line notes" value={platform} onChange={e=>setPlatform(e.target.value)}/>
    <button onClick={save}>Save route timing</button>
    {routeTimes.items.slice(0,2).map(x=><small className="savedRoute">Saved: depart {x.departure || '?'} · arrive {x.arrival || '?'} · {x.platform || 'platform to confirm'}</small>)}
  </div>
}

function LexieJournal({journal,rewards,photos,drawings}){
  const [page,setPage]=useState('pre');
  const current = lexiePages.find(p=>p.id===page) || lexiePages[0];
  const [answers,setAnswers] = useState({});
  async function saveEntry(){
    await journal.add({ pageId:current.id, pageTitle:current.title, emoji:current.emoji, answers, author:'Lexie', day:dateKey() });
    await rewards.add({ day:dateKey(), stars:1, reason:`Journal entry: ${current.title}`, type:'journal' });
    setAnswers({});
  }
  return <section className="grid">
    <Card title="Lexie's Adventure Book" icon={<BookOpen/>}>
      <div className="dayTabs">{lexiePages.map(p=><button className={page===p.id?'active chip':'chip'} onClick={()=>setPage(p.id)}>{p.emoji} {p.label}</button>)}</div>
      <h2>{current.emoji} {current.title}</h2>
      {current.prompts.map((p,i)=><div className="prompt" key={p}>
        <label>{p}</label>
        <textarea value={answers[p]||''} onChange={e=>setAnswers({...answers,[p]:e.target.value})} placeholder="Write or ask Mum/Dad to help type..." />
      </div>)}
      <button onClick={saveEntry}>Save journal page and earn ⭐</button>
    </Card>
    <Card title="Confidence Toolkit" icon={<Heart/>}><ul><li>Talk to Mum or Dad.</li><li>Use the translator phrase cards.</li><li>Find plain food or a snack break.</li><li>Take 3 slow breaths.</li><li>Look at today's plan and pick one small next step.</li></ul></Card>
    <DrawingStudio drawings={drawings} rewards={rewards} pageTitle={current.title}/>
    <PhotoUploader photos={photos} rewards={rewards} source="Lexie Journal"/>
    <Card title="Saved Journal Pages" icon={<Sparkles/>}>{journal.items.length===0?<p>No journal pages yet.</p>:journal.items.slice(0,8).map(e=><div className="note"><b>{e.emoji} {e.pageTitle}</b><small>{e.deviceDate || ''}</small>{e.answers && Object.entries(e.answers).slice(0,4).map(([q,a])=><p><b>{q}</b><br/>{a}</p>)}</div>)}</Card>
  </section>
}

function DrawingStudio({drawings,rewards,pageTitle='Drawing'}){
  const canvasRef = useRef(null);
  const [drawing,setDrawing]=useState(false);
  const [color,setColor]=useState('#ff6fb1');
  const [size,setSize]=useState(6);
  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const ctx=c.getContext('2d'); ctx.fillStyle='#fffafc'; ctx.fillRect(0,0,c.width,c.height);
  },[]);
  function pos(e){
    const rect=canvasRef.current.getBoundingClientRect();
    const touch=e.touches?.[0] || e;
    return {x:(touch.clientX-rect.left)*(canvasRef.current.width/rect.width), y:(touch.clientY-rect.top)*(canvasRef.current.height/rect.height)};
  }
  function start(e){e.preventDefault(); setDrawing(true); const ctx=canvasRef.current.getContext('2d'); const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y);}
  function move(e){ if(!drawing)return; e.preventDefault(); const ctx=canvasRef.current.getContext('2d'); const p=pos(e); ctx.lineWidth=size; ctx.lineCap='round'; ctx.strokeStyle=color; ctx.lineTo(p.x,p.y); ctx.stroke();}
  function end(){setDrawing(false);}
  function clear(){ const c=canvasRef.current; const ctx=c.getContext('2d'); ctx.fillStyle='#fffafc'; ctx.fillRect(0,0,c.width,c.height);}
  async function save(){
    const blob = await new Promise(res=>canvasRef.current.toBlob(res,'image/png'));
    const file = new File([blob], `lexie-drawing-${Date.now()}.png`, {type:'image/png'});
    const uploaded = await uploadFile(file,'drawings');
    await drawings.add({ ...uploaded, pageTitle, author:'Lexie' });
    await rewards.add({ day:dateKey(), stars:1, reason:`Drawing saved: ${pageTitle}`, type:'drawing' });
    alert('Drawing saved and ⭐ earned!');
  }
  return <Card title="Drawing Pad" icon={<Palette/>}>
    <p>Works with finger or Apple Pencil on iPad.</p>
    <div className="drawTools"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><input type="range" min="2" max="22" value={size} onChange={e=>setSize(Number(e.target.value))}/><button onClick={clear}><Eraser/> Clear</button><button onClick={save}><Save/> Save + ⭐</button></div>
    <canvas ref={canvasRef} width="700" height="420" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}></canvas>
    <div className="photoGrid">{drawings.items.slice(0,4).map(d=><a href={d.url} target="_blank"><img src={d.url}/></a>)}</div>
  </Card>
}

function PhotoUploader({photos,rewards,source='Photo Memories'}){
  const [caption,setCaption]=useState('');
  const [busy,setBusy]=useState(false);
  async function handle(e){
    const files=[...e.target.files];
    if(!files.length) return;
    setBusy(true);
    for(const file of files){
      const uploaded = await uploadFile(file,'photos');
      await photos.add({ ...uploaded, caption, source, author:'Family' });
      await rewards.add({ day:dateKey(), stars:1, reason:`Photo uploaded: ${caption || source}`, type:'photo' });
    }
    setCaption(''); setBusy(false); e.target.value='';
  }
  return <Card title="Photo Uploads" icon={<Camera/>}>
    <input placeholder="Caption or memory" value={caption} onChange={e=>setCaption(e.target.value)}/>
    <label className="upload"><Upload/> {busy?'Uploading...':'Upload photos and earn ⭐'}<input type="file" multiple accept="image/*" onChange={handle}/></label>
    <div className="photoGrid">{photos.items.slice(0,8).map(p=><a href={p.url} target="_blank"><img src={p.url}/><small>{p.caption}</small></a>)}</div>
  </Card>
}

function JapaneseLearning({progress,rewards}){
  async function complete(lesson){
    const already = progress.items.some(x=>x.lessonId===lesson.id);
    if(!already){
      await progress.add({lessonId:lesson.id, en:lesson.en, ja:lesson.ja, romaji:lesson.romaji, practised:true});
      await rewards.add({ day:dateKey(), stars:1, reason:`Practised Japanese: ${lesson.en}`, type:'japanese' });
    }
  }
  return <section className="grid" id="phrases">
    <Card title="Japanese Phrase Quest" icon={<GraduationCap/>}><p>Practising simple phrases before departure earns Lexie journal rewards. Mum or Dad can help.</p></Card>
    {japaneseLessons.map(l=>{
      const done=progress.items.some(x=>x.lessonId===l.id);
      return <Card key={l.id} title={`${done?'✅':'🇯🇵'} ${l.en}`} icon={<Mic/>}>
        <div className="ja">{l.ja}</div><p>{l.romaji}</p><small>{l.category}</small>
        <button onClick={()=>speak(l.ja)}>Hear it</button>
        <button disabled={done} onClick={()=>complete(l)}>{done?'Star earned':'Practised it + ⭐'}</button>
      </Card>
    })}
  </section>
}

function Rewards({rewards}){
  const total = rewards.items.reduce((a,b)=>a+(b.stars||1),0);
  const todayTotal = rewards.items.filter(r=>r.day===dateKey()).reduce((a,b)=>a+(b.stars||1),0);
  const milestones = [
    [5,'Explorer Badge'],[15,'Tokyo Snack Reward'],[30,'Souvenir Reward'],[50,'Adventure Champion'],[75,'Japan Expert'],[100,'Ultimate Explorer']
  ];
  return <section className="grid">
    <Card title="Lexie's Rewards" icon={<Trophy/>}><div className="big">{total} ⭐</div><p>Today: {Math.min(todayTotal,5)}/5 easy daily stars.</p><div className="stars">{Array.from({length:5}).map((_,i)=><span className={i<todayTotal?'won':''}>⭐</span>)}</div></Card>
    <Card title="Milestones" icon={<Gift/>}>{milestones.map(([n,label])=><div className={total>=n?'milestone won':'milestone'}><b>{n} ⭐</b><span>{label}</span></div>)}</Card>
    <Card title="Recent Stars" icon={<Star/>}>{rewards.items.slice(0,20).map(r=><div className="mini">⭐ {r.reason}<small>{r.deviceDate}</small></div>)}</Card>
  </section>
}

function Photos({photos}){
  return <section className="grid"><PhotoUploader photos={photos} rewards={{add:async()=>{}}} source="Photo Wall"/><Card title="Shared Photo Wall" icon={<ImageIcon/>}><div className="photoGrid bigGrid">{photos.items.map(p=><a href={p.url} target="_blank"><img src={p.url}/><small>{p.caption || p.name}</small></a>)}</div></Card></section>
}

function Emergency(){
  const lexieCard = 'My name is Lexie. My Dad is Jase and my Mum is Ash. Please call my family. 私の名前はレクシーです。父はジェイス、母はアッシュです。家族に電話してください。';
  return <section className="grid" id="emergency">
    <Card title="Japan Emergency Contacts" icon={<Shield/>}>
      <a className="call" href="tel:110">🚓 Police: 110</a>
      <a className="call" href="tel:119">🚑 Ambulance / Fire: 119</a>
      <a className="pill" href={appleMaps('Australian Embassy Tokyo')} target="_blank">Australian Embassy Tokyo</a>
      <p className="tiny">Use hotel staff or nearby station staff for help if unsure.</p>
    </Card>
    <Card title="Hotel" icon={<Home/>}><p><b>{HOTEL.name}</b></p><p>{HOTEL.address}</p><a className="pill" href={appleMaps(HOTEL.apple)} target="_blank">Open hotel map</a></Card>
    <Card title="Lexie Help Card" icon={<Users/>}><textarea readOnly value={lexieCard}/><button onClick={()=>navigator.clipboard?.writeText(lexieCard)}>Copy Lexie card</button></Card>
    <Card title="Family Contacts" icon={<PhoneIcon/>}><p>Dad: Jase</p><p>Mum: Ash</p><p>Add phone numbers in Add Info or iPhone contacts before departure.</p></Card>
  </section>
}

function Food(){
  const places = [
    ['Tokyo Disney Resort','Fries, popcorn, ice cream, pizza, chicken tenders/nuggets if available'],
    ['Sanrio Puroland','Desserts, ice cream, pizza-style options, plain bakery snacks'],
    ['Mount Fuji','Bring backup snacks, plain noodles, convenience store basics'],
    ['Harajuku','McDonald’s/KFC backup, crepes without sauce, plain chips, ice cream'],
    ['Ochanomizu','Convenience store basics, bakery, simple snacks']
  ];
  return <section className="grid" id="food">
    <Card title="Dad & Mum Vegetarian Mode" icon={<Utensils/>}><p>Watch for hidden dashi, fish stock, chicken broth and meat extracts.</p><ul><li>T’s TanTan near Tokyo Station</li><li>Ain Soph locations</li><li>Vegetarian curry where confirmed</li><li>Carry snacks for Fuji and Sumo days</li></ul></Card>
    <Card title="Lexie Plain-Food Mode" icon={<Utensils/>}><p>Lexie is not vegetarian. She prefers simple food with no sauce or strong flavours.</p><ul><li>Chicken nuggets</li><li>Hot chips/fries</li><li>Chicken noodles</li><li>Plain pasta with no sauce</li><li>Pizza, toast, ice cream, pancakes</li></ul></Card>
    {places.map(([name,ideas])=><Card title={name} icon={<MapPin/>}><p>{ideas}</p><a className="pill" target="_blank" href={appleMaps(`${name} McDonald's KFC fries noodles`) }>Find simple food nearby</a></Card>)}
  </section>
}

function Currency({aud,setAud,jpy,setJpy}){
  return <section className="grid"><Card title="Offline AUD ⇄ JPY Converter" icon={<Wallet/>}><p>Last known rate: 1 AUD ≈ ¥{AUD_TO_JPY.toFixed(3)} JPY.</p><label>AUD</label><input type="number" value={aud} onChange={e=>{const v=Number(e.target.value); setAud(v); setJpy(Math.round(v*AUD_TO_JPY))}}/><label>JPY</label><input type="number" value={jpy} onChange={e=>{const v=Number(e.target.value); setJpy(v); setAud((v/AUD_TO_JPY).toFixed(2))}}/><p className="big">${aud} ≈ ¥{Number(jpy).toLocaleString()}</p></Card></section>
}

function Phone(){
  return <section className="grid" id="apple-maps-setup">
    <Card title="Access on iPhone/iPad" icon={<Smartphone/>}><ol><li>Open the Vercel link in Safari.</li><li>Tap Share.</li><li>Tap Add to Home Screen.</li><li>Open it from the new icon.</li><li>Open once while online to cache files.</li></ol></Card>
    <Card title="Apple Maps Offline Setup" icon={<MapPin/>}><ol><li>Open Apple Maps before the trip.</li><li>Search Tokyo and choose Download Map.</li><li>Download Narita, Maihama/Disney, Tama Center/Puroland and Mount Fuji/Kawaguchiko.</li><li>Save hotel, airport, Disney, Puroland and Fuji meeting point as favourites.</li></ol></Card>
    <Card title="ALDI Prepaid SIM Notes" icon={<Smartphone/>}><ul><li>Turn on international roaming before leaving Australia.</li><li>Use hotel Wi-Fi where possible.</li><li>Download offline maps and translator packs before departure.</li><li>Keep screenshots/PDFs of tickets in Apple Files and Photos as backup.</li></ul></Card>
  </section>
}

function AddInfo({notes}){
  const [title,setTitle]=useState('');
  const [body,setBody]=useState('');
  async function add(){ if(!title&&!body)return; await notes.add({title,body,author:'Family'}); setTitle(''); setBody('');}
  return <section className="grid">
    <Card title="Add New Information" icon={<PlusCircle/>}><input placeholder="Title, booking, restaurant, reminder..." value={title} onChange={e=>setTitle(e.target.value)}/><textarea placeholder="Paste details, translated text, notes, reminders or travel tips..." value={body} onChange={e=>setBody(e.target.value)}/><button onClick={add}>Save and sync</button></Card>
    <Card title="Saved Notes" icon={<BookOpen/>}>{notes.items.length===0?<p>No notes yet.</p>:notes.items.map(n=><div className="note"><b>{n.title}</b><small>{n.deviceDate}</small><p>{n.body}</p></div>)}</Card>
    <Card title="Discovery Suggestions" icon={<Sparkles/>}>{discoveryIdeas.map(x=><div className="note"><b>{x.emoji} {x.title}</b><p>{x.why}</p><small>{x.challenge}</small></div>)}</Card>
  </section>
}

createRoot(document.getElementById('root')).render(<App/>);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
