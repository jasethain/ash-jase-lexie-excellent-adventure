import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  MapPin,
  Mic,
  Camera,
  Wallet,
  BookOpen,
  Utensils,
  Train,
  PlusCircle,
  Smartphone,
  Sparkles,
  Heart,
  Download,
  Star,
  Bell,
  Shield,
  Palette,
  Trophy,
  Languages,
  FileText,
  CheckCircle2,
  Home,
  PhoneCall,
  Upload,
  Trash2,
  Pencil
} from 'lucide-react';
import './styles.css';

const firebaseConfig = {
  apiKey: 'AIzaSyDmlH6crdNzfmEO-vr-zLr3KOjp857HN60',
  authDomain: 'ajl-japan-adventure.firebaseapp.com',
  projectId: 'ajl-japan-adventure',
  storageBucket: 'ajl-japan-adventure.firebasestorage.app',
  messagingSenderId: '241722632776',
  appId: '1:241722632776:web:0a7b4ec866641bfd78467d'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const AUD_TO_JPY = 112.905;
const today = new Date();
const HOTEL = 'APA Hotel & Resort Tokyo Bay Shiomi, 2-8-6 Shiomi, Koto 135-0052 Tokyo';
const HOTEL_STATION = 'Shiomi Station';

const assets = {
  qantas: '/assets/Qantas_E_Ticket_DQ3AT8.pdf',
  fujiMeeting: '/assets/Tokyo_Meeting_Point.jpg'
};

const itinerary = [
  { date:'1 Jul 2026', day:'Day 1', icon:'✈️', title:'Melbourne to Tokyo Narita', destination:'Narita International Airport', apple:'Narita International Airport', activity:'Arrival day. Private transfer booked from Narita Airport to Tokyo hotel at 21:30.', lexiePrompt:'What do you think Japan will look, sound and smell like when we arrive?', dadMum:'Dad and Mum check passports, bags, phone roaming and airport transfer.' },
  { date:'2 Jul 2026', day:'Day 2', icon:'🍲', title:'Sumo Entertainment Show', destination:'Tokyo Sumo show', apple:'Tokyo Sumo show', activity:'Sumo night. Confirm vegetarian meals for Dad/Mum and plain-food backup for Lexie.', lexiePrompt:'What do you think sumo wrestlers do before a match?', dadMum:'Dad/Mum: confirm meal requirements and plan Lexie simple food before or after.' },
  { date:'3 Jul 2026', day:'Day 3', icon:'🗻', title:'Mount Fuji Full Day Tour', destination:'Tokyo Station Stand T', apple:'Tokyo Station', activity:'8:00 AM departure from Tokyo Stand T. Guide info expected around 6 PM the day before.', lexiePrompt:'Draw what you think Mount Fuji will look like before we see it.', dadMum:'Dad/Mum: leave early, carry snacks, jackets, water, cash and power bank.' },
  { date:'4 Jul 2026', day:'Day 4', icon:'🌈', title:'Free Day: TeamLab / Shibuya / Harajuku', destination:'teamLab Planets TOKYO', apple:'teamLab Planets TOKYO', activity:'Best spare-time pick: TeamLab Planets, Shibuya Sky, Harajuku and Kiddy Land.', lexiePrompt:'What colours, lights or cute shops are you hoping to see?', dadMum:'Dad/Mum: keep this flexible and use quiet breaks if needed.' },
  { date:'5 Jul 2026', day:'Day 5', icon:'🎸', title:'Free Day: Guitar Street / Akihabara / Ueno', destination:'Ochanomizu Station', apple:'Ochanomizu Station', activity:'Dad: guitar stores. Mum/Lexie: kawaii shops, purikura, arcades and simple food stops.', lexiePrompt:'What should Dad look for in the guitar shops?', dadMum:'Dad/Mum: decide together whether to split briefly or stay together.' },
  { date:'6 Jul 2026', day:'Day 6', icon:'🎀', title:'Sanrio Puroland', destination:'Sanrio Puroland', apple:'Sanrio Puroland', activity:'Hello Kitty day. Prioritise parades, character meets, shops, themed desserts and journal stamps.', lexiePrompt:'Which Sanrio character are you most excited to meet, and why?', dadMum:'Dad/Mum: allow lots of photo time and souvenir browsing.' },
  { date:'7 Jul 2026', day:'Day 7', icon:'🏰', title:'Tokyo Disneyland', destination:'Tokyo Disneyland', apple:'Tokyo Disneyland', activity:'Full Disney day. Use Apple Maps to Maihama. Lexie food hunt: fries, popcorn, nuggets/tenders, pizza, ice cream.', lexiePrompt:'What ride, character or treat are you most excited about at Disney, and why?', dadMum:'Dad/Mum: tickets need to be displayed in the Tokyo Disney Resort App or electronic ticket.' },
  { date:'8 Jul 2026', day:'Day 8', icon:'✈️', title:'Return Travel', destination:'Narita International Airport', apple:'Narita International Airport', activity:'Private transfer booked from APA Hotel & Resort Tokyo Bay Shiomi to Narita Airport at 15:30.', lexiePrompt:'What memory from Japan do you want to keep forever?', dadMum:'Dad/Mum: pack the night before and keep passports, insurance and chargers together.' }
];

const routeCards = [
  { title:'Hotel → Tokyo Disneyland', emoji:'🏰', date:'7 Jul', from:HOTEL, to:'Tokyo Disneyland', baseline:['Walk to Shiomi Station','JR Keiyo Line from Shiomi to Maihama','Walk from Maihama to Tokyo Disneyland'], returnRoute:['Walk to Maihama Station','JR Keiyo Line from Maihama to Shiomi','Walk back to hotel'], timing:'Check Apple Maps morning of travel for exact departure, arrival and platform. Baseline train ride is short because Shiomi and Maihama are both on/near the JR Keiyo route.', docs:'Disney ticket reminder', docHref:null },
  { title:'Hotel → Sanrio Puroland', emoji:'🎀', date:'6 Jul', from:HOTEL, to:'Sanrio Puroland', baseline:['Walk to Shiomi Station','JR Keiyo Line toward Tokyo','Transfer through central Tokyo toward Shinjuku/Keio route','Travel to Tama-Center area','Walk to Sanrio Puroland'], returnRoute:['Walk to Tama-Center station','Return via Keio/Odakyu and JR connections','Arrive Shiomi Station','Walk to hotel'], timing:'Use Apple Maps live routing for exact train, platform and return timing. This is a longer cross-city day, so check before leaving and again before returning.', docs:'Puroland ticket reminder', docHref:null },
  { title:'Hotel → Mount Fuji Tour Stand T', emoji:'🗻', date:'3 Jul', from:HOTEL, to:'Tokyo Station Stand T', baseline:['Leave hotel early','Walk to Shiomi Station','JR Keiyo Line to Tokyo Station','Follow station signs to selected Stand T meeting point','Arrive well before 8:00 AM departure'], returnRoute:['Tour returns to Tokyo area','Use Apple Maps from drop-off point to hotel','Return to Shiomi Station','Walk to hotel'], timing:'Tour departs 8:00 AM. Target arrival at meeting area around 7:30 AM. Check guide email around 6 PM the day before.', docs:'Fuji meeting point image', docHref:assets.fujiMeeting },
  { title:'Hotel → Sumo Show', emoji:'🍲', date:'2 Jul', from:HOTEL, to:'Tokyo Sumo show', baseline:['Open Apple Maps with exact voucher location','Route from APA Hotel Tokyo Bay Shiomi','Check train/walk/taxi options','Leave buffer for dinner/show entry'], returnRoute:['Open Apple Maps from venue','Choose train or taxi based on Lexie energy level','Return to hotel'], timing:'The voucher should be checked for the exact venue address. Once confirmed, Apple Maps will show platforms and live timing.', docs:'Sumo booking details', docHref:null },
  { title:'Hotel → TeamLab Planets', emoji:'🌈', date:'4 Jul', from:HOTEL, to:'teamLab Planets TOKYO', baseline:['Open Apple Maps route','Likely Tokyo Bay area transit/taxi option','Keep flexible spare-time day'], returnRoute:['Return via Apple Maps from Toyosu area to hotel','Choose taxi if tired'], timing:'Book/confirm entry time before travel. Use live route card for exact departure and platform.', docs:'Free-day suggestion', docHref:null },
  { title:'Hotel → Ochanomizu Guitar Street', emoji:'🎸', date:'5 Jul', from:HOTEL, to:'Ochanomizu Station', baseline:['Walk to Shiomi Station','JR connection through Tokyo area','Arrive Ochanomizu Station','Walk guitar shops'], returnRoute:['Return from Ochanomizu Station','JR connections back to Shiomi','Walk to hotel'], timing:'Use Apple Maps live routing for exact JR lines, platforms and timing.', docs:'Dad guitar day', docHref:null },
  { title:'Hotel → Narita Airport', emoji:'✈️', date:'8 Jul', from:HOTEL, to:'Narita International Airport', baseline:['Private transfer from hotel','Pickup at APA Hotel & Resort Tokyo Bay Shiomi','Depart 15:30'], returnRoute:['Not applicable'], timing:'Private transfer pickup is booked for 15:30 from APA Hotel & Resort Tokyo Bay Shiomi.', docs:'Qantas e-ticket', docHref:assets.qantas }
];

const places = [
  { name:'Tokyo Disneyland', type:'booking', emoji:'🏰', prompts:['Favourite ride?', 'Best snack?', 'Best character or photo spot?', 'What did the castle look like?'], lexieFood:['French fries', 'Popcorn', 'Ice cream', 'Pizza', 'Chicken tenders/nuggets if available'] },
  { name:'Sanrio Puroland', type:'booking', emoji:'🎀', prompts:['Favourite Sanrio character?', 'Best shop?', 'Favourite cute dessert?', 'What did you buy or want to buy?'], lexieFood:['Desserts', 'Ice cream', 'Pizza-style options', 'Plain bakery snacks'] },
  { name:'Mount Fuji', type:'booking', emoji:'🗻', prompts:['First reaction seeing Fuji?', 'Best photo?', 'Weather today?', 'What did the mountain look like?'], lexieFood:['Bring backup snacks', 'Plain noodles where available', 'Chips/snacks from convenience stores'] },
  { name:'Sumo Show', type:'booking', emoji:'🍲', prompts:['What was the coolest sumo move?', 'What did the ring ceremony look like?', 'Best photo or video?'], lexieFood:['Eat before if hot pot is not suitable', 'Look for nuggets/chips/noodles nearby'] },
  { name:'Harajuku', type:'spare time', emoji:'🌸', prompts:['Cutest thing seen?', 'Best shop?', 'Best photo booth?', 'Favourite sweet treat?'], lexieFood:['McDonald’s/KFC style backup', 'Crepes without sauce', 'Plain chips', 'Ice cream'] },
  { name:'Ochanomizu Guitar Street', type:'spare time', emoji:'🎸', prompts:['Best guitar seen?', 'Favourite shop?', 'Did Dad find treasure?'], lexieFood:['Nearby convenience store basics', 'Simple bakery food'] }
];

const japaneseLessons = [
  { id:'hello', level:'Beginner', en:'Hello', ja:'こんにちは', romaji:'Konnichiwa', reward:'Japanese Hello Star' },
  { id:'thanks', level:'Beginner', en:'Thank you', ja:'ありがとう', romaji:'Arigatou', reward:'Thank You Star' },
  { id:'excuse', level:'Travel', en:'Excuse me', ja:'すみません', romaji:'Sumimasen', reward:'Polite Traveller Star' },
  { id:'platform', level:'Train', en:'Which platform?', ja:'何番線ですか？', romaji:'Nanbansen desu ka?', reward:'Train Helper Star' },
  { id:'howmuch', level:'Shopping', en:'How much is it?', ja:'いくらですか？', romaji:'Ikura desu ka?', reward:'Shopping Star' },
  { id:'nuggets', level:'Food', en:'Do you have chicken nuggets?', ja:'チキンナゲットはありますか？', romaji:'Chikin nagetto wa arimasu ka?', reward:'Plain Food Finder Star' },
  { id:'fries', level:'Food', en:'Do you have hot chips?', ja:'フライドポテトはありますか？', romaji:'Furaido poteto wa arimasu ka?', reward:'Chip Champion Star' },
  { id:'plainpasta', level:'Food', en:'Plain pasta, no sauce please', ja:'ソースなしのプレーンパスタをお願いします。', romaji:'Sōsu nashi no purēn pasuta o onegaishimasu', reward:'Plain Pasta Star' },
  { id:'vegetarian', level:'Dad/Mum Food', en:'I am vegetarian', ja:'私はベジタリアンです。', romaji:'Watashi wa bejitarian desu', reward:'Family Helper Star' },
  { id:'help', level:'Safety', en:'Please help me', ja:'助けてください。', romaji:'Tasukete kudasai', reward:'Safety Star' }
];

const reminderSeeds = [
  { id:'r-passports', due:'Before travel', title:'Check passports for Dad, Mum and Lexie', detail:'Keep passport photos/scans in Apple Files as backup.', linkLabel:'Add passport details in Emergency tab', link:'#emergency' },
  { id:'r-insurance', due:'Before travel', title:'Save Qantas travel insurance policy', detail:'Add emergency phone number and policy details to Emergency tab.', linkLabel:'Open Emergency Hub', link:'#emergency' },
  { id:'r-maps', due:'Before travel', title:'Download Apple Maps offline areas', detail:'Tokyo, Narita, Maihama/Disney, Tama Center/Puroland, Fuji/Kawaguchiko.', linkLabel:'Open Apple Maps setup', link:'#routes' },
  { id:'r-roaming', due:'Before travel', title:'Turn on ALDI roaming before leaving Australia', detail:'Dad and Mum are on ALDI prepaid SIM cards. Use hotel Wi-Fi where possible.', linkLabel:'Phone setup notes', link:'#phone' },
  { id:'r-lexie-food', due:'Before travel', title:'Pack Lexie plain-food backup snacks', detail:'Nuggets/chips may not always be nearby. Carry safe snacks for train/tour days.', linkLabel:'Open Lexie Food Mode', link:'#food' },
  { id:'r-japanese', due:'Before travel', title:'Lexie learns 3 Japanese phrases', detail:'Each phrase earns a reward star in Lexie’s journal.', linkLabel:'Open Japanese Lessons', link:'#learn' },
  { id:'r-narita-arrival', due:'1 Jul', title:'Narita arrival private transfer 21:30', detail:'Private transfer booked from Narita Airport to Tokyo hotel.', linkLabel:'Open route card', link:'#routes' },
  { id:'r-sumo-meal', due:'2 Jul', title:'Confirm vegetarian meals for Sumo Show', detail:'Chicken hot pot is not suitable for Dad/Mum vegetarian meals unless alternative is confirmed.', linkLabel:'Open Sumo route/reminder', link:'#routes' },
  { id:'r-fuji-guide', due:'2 Jul 18:00', title:'Check Fuji guide email around 6 PM', detail:'Guide information may arrive in spam the night before the tour.', linkLabel:'Open Fuji meeting point', link:assets.fujiMeeting },
  { id:'r-fuji-pack', due:'3 Jul 06:30', title:'Fuji tour bag check', detail:'Power bank, jackets, water, cash, Lexie snacks, booking details.', linkLabel:'Open Fuji meeting point', link:assets.fujiMeeting },
  { id:'r-puroland', due:'6 Jul', title:'Sanrio Puroland tickets and route check', detail:'Open Apple Maps and check live train platforms before leaving hotel.', linkLabel:'Open route cards', link:'#routes' },
  { id:'r-disney-app', due:'7 Jul', title:'Tokyo Disney ticket/app check', detail:'Disney confirmation says use Tokyo Disney Resort App or electronic ticket for park entry.', linkLabel:'Open route cards', link:'#routes' },
  { id:'r-return-transfer', due:'8 Jul 15:30', title:'Private transfer to Narita Airport', detail:'Pickup from APA Hotel & Resort Tokyo Bay Shiomi at 15:30.', linkLabel:'Open Qantas e-ticket', link:assets.qantas }
];

const emergencyContacts = [
  { name:'Japan Police', number:'110', detail:'Police emergencies in Japan', type:'call' },
  { name:'Japan Ambulance / Fire', number:'119', detail:'Ambulance or fire emergencies in Japan', type:'call' },
  { name:'Japan Visitor Hotline', number:'050-3816-2787', detail:'Tourist information and help', type:'call' },
  { name:'Australian Embassy Tokyo', number:'03-5232-4111', detail:'Australian Embassy switchboard in Tokyo', type:'call' },
  { name:'Australian Consular Emergency Centre', number:'+61 2 6261 3305', detail:'24-hour Australian Government emergency consular help from overseas', type:'call' },
  { name:'Hotel', number:'', detail:HOTEL, type:'map', map:HOTEL }
];

function useLocal(key, initial){
  const [value,setValue] = useState(()=>{ try { return JSON.parse(localStorage.getItem(key)) ?? initial } catch { return initial }});
  useEffect(()=>localStorage.setItem(key, JSON.stringify(value)),[key,value]);
  return [value,setValue];
}

function useFirebaseCollection(name, fallback = []){
  const [items,setItems] = useLocal(`offline-${name}`, fallback);
  const [ready,setReady] = useState(false);
  useEffect(()=>{
    let unsubAuth = onAuthStateChanged(auth, async user => {
      try{
        if(!user) await signInAnonymously(auth);
        const q = query(collection(db, name), orderBy('createdAt','desc'));
        const unsub = onSnapshot(q, snap => {
          const rows = snap.docs.map(d=>({id:d.id,...d.data()}));
          setItems(rows); setReady(true);
        });
        unsubAuth = () => unsub();
      } catch(e){ console.warn('Firebase sync unavailable, local fallback active.', e); setReady(false); }
    });
    return ()=>{ if(typeof unsubAuth === 'function') unsubAuth(); };
  },[name]);
  async function add(item){
    const local = { id:`local-${Date.now()}`, ...item, createdAt: Date.now() };
    setItems(prev=>[local,...prev]);
    try { await addDoc(collection(db, name), { ...item, createdAt: serverTimestamp() }); } catch(e){ console.warn(e); }
  }
  async function patch(id, changes){
    setItems(prev=>prev.map(x=>x.id===id?{...x,...changes}:x));
    try { if(!String(id).startsWith('local-')) await updateDoc(doc(db,name,id), changes); } catch(e){ console.warn(e); }
  }
  async function remove(id){
    setItems(prev=>prev.filter(x=>x.id!==id));
    try { if(!String(id).startsWith('local-')) await deleteDoc(doc(db,name,id)); } catch(e){ console.warn(e); }
  }
  return {items, add, patch, remove, ready};
}

function say(text){
  if(!('speechSynthesis' in window)) return alert('Speech is not available on this device/browser.');
  const u = new SpeechSynthesisUtterance(text); u.lang='ja-JP'; speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function appleMaps(query){ return `https://maps.apple.com/?q=${encodeURIComponent(query)}`; }
function appleRoute(from,to){ return `https://maps.apple.com/?saddr=${encodeURIComponent(from)}&daddr=${encodeURIComponent(to)}&dirflg=r`; }
function callLink(number){ return `tel:${number.replace(/[^+0-9]/g,'')}`; }
function stampDate(){ return new Date().toLocaleString(); }

function App(){
  const [tab,setTab] = useState('home');
  const journal = useFirebaseCollection('lexieJournal');
  const notes = useFirebaseCollection('sharedNotes');
  const rewards = useFirebaseCollection('lexieRewards');
  const reminders = useFirebaseCollection('smartReminders', reminderSeeds);
  const photos = useFirebaseCollection('tripPhotos');
  const drawings = useFirebaseCollection('lexieDrawings');
  const [aud,setAud] = useState(50); const [jpy,setJpy] = useState(Math.round(50*AUD_TO_JPY));
  const nextTrip = Math.ceil((new Date('2026-07-01T09:00:00+10:00')-today)/(1000*60*60*24));
  const tabs = [
    ['home','Home','🎀'],['reminders','Reminders','🔔'],['routes','Routes','🚆'],['journal','Lexie Journal','📖'],['rewards','Rewards','⭐'],['learn','Japanese','🇯🇵'],['emergency','Emergency','🚨'],['food','Food','🍟'],['translate','Translator','🎤'],['money','Currency','💴'],['phone','Apple Devices','📱'],['add','Add Info','➕']
  ];
  useEffect(()=>{
    if(location.hash){ const id=location.hash.replace('#',''); setTab(id); }
  },[]);
  const starsToday = rewards.items.filter(r => new Date(r.date || r.createdAt || Date.now()).toDateString() === new Date().toDateString()).length;
  return <div className="app">
    <div className="sakura"></div><div className="bows"></div>
    <header><div className="kitty">🎀</div><div><h1>Ash, Jase & Lexie's Excellent Adventure</h1><p>Hello Kitty inspired Japan companion for Dad, Mum and Lexie</p></div></header>
    <nav>{tabs.map(t=><button key={t[0]} onClick={()=>{setTab(t[0]); history.replaceState(null,'',`#${t[0]}`)}} className={tab===t[0]?'active':''}><span>{t[2]}</span>{t[1]}</button>)}</nav>
    <main>
      {tab==='home' && <HomeScreen nextTrip={nextTrip} starsToday={starsToday} reminders={reminders.items} photos={photos.items} />}
      {tab==='reminders' && <Reminders reminders={reminders} />}
      {tab==='routes' && <Routes />}
      {tab==='journal' && <LexieJournal journal={journal} rewards={rewards} photos={photos} drawings={drawings} />}
      {tab==='rewards' && <Rewards rewards={rewards} journal={journal.items} photos={photos.items} drawings={drawings.items} />}
      {tab==='learn' && <JapaneseLessons rewards={rewards} />}
      {tab==='emergency' && <Emergency />}
      {tab==='food' && <Food />}
      {tab==='translate' && <Translator />}
      {tab==='money' && <Currency aud={aud} setAud={setAud} jpy={jpy} setJpy={setJpy} />}
      {tab==='phone' && <Phone />}
      {tab==='add' && <AddInfo notes={notes} photos={photos} />}
    </main>
  </div>
}
function Card({title,icon,children}){return <article className="card"><h2>{icon}{title}</h2>{children}</article>}
function HomeScreen({nextTrip,starsToday,reminders,photos}){
  const openReminders = reminders.filter(r=>!r.done).slice(0,5);
  return <section className="grid">
    <Card title="Tokyo Countdown" icon={<Sparkles/>}><div className="big">{nextTrip>0?nextTrip:'Trip time!'} days</div><p>Hotel base: APA Hotel & Resort Tokyo Bay Shiomi.</p><div className="stampRow"><span>✈️</span><span>🍲</span><span>🗻</span><span>🎀</span><span>🏰</span></div></Card>
    <Card title="Lexie’s Stars Today" icon={<Trophy/>}><div className="big">{starsToday}/5</div><p>Daily stars can be earned through journal writing, photos, drawings, phrase learning and adventure prompts.</p></Card>
    <Card title="Next Smart Reminders" icon={<Bell/>}>{openReminders.length===0?<p>All reminders ticked. Sparkly calm restored.</p>:openReminders.map(r=><div className="note" key={r.id}><b>{r.title}</b><small>{r.due}</small><p>{r.detail}</p></div>)}</Card>
    <Card title="Booking Wallet" icon={<Download/>}><a href={assets.qantas}>Open Qantas e-ticket PDF</a><a href={assets.fujiMeeting}>Open Fuji meeting point image</a></Card>
    <Card title="Latest Photos" icon={<Camera/>}>{photos.slice(0,3).map(p=><img key={p.id} alt={p.title||'Trip upload'} src={p.url} style={{width:'100%',borderRadius:16,marginBottom:10}} />)}{photos.length===0 && <p>No shared photos yet.</p>}</Card>
  </section>
}
function Reminders({reminders}){
  const [title,setTitle] = useState(''); const [due,setDue] = useState(''); const [detail,setDetail] = useState(''); const [link,setLink] = useState('');
  const items = reminders.items.length ? reminders.items : reminderSeeds;
  async function addCustom(){ if(!title.trim()) return; await reminders.add({title,due:due||'Custom',detail,link,linkLabel:link?'Open link':'',done:false}); setTitle(''); setDue(''); setDetail(''); setLink(''); }
  async function seedDefaults(){ for(const r of reminderSeeds){ await setDoc(doc(db,'smartReminders',r.id), {...r, done:false, createdAt:serverTimestamp()}, {merge:true}); } }
  return <section className="grid">
    <Card title="Smart Reminders With Tick Boxes" icon={<Bell/>}><p>Tick boxes sync across Dad, Mum and Lexie’s devices. Items open documents or route cards where relevant.</p><button onClick={seedDefaults}>Refresh default reminder list</button>{items.map(r=><div className="note reminder" key={r.id}><label style={{display:'flex',gap:10,alignItems:'flex-start'}}><input type="checkbox" checked={!!r.done} onChange={e=>reminders.patch(r.id,{done:e.target.checked,doneAt:e.target.checked?stampDate():''})}/><span><b style={{textDecoration:r.done?'line-through':'none'}}>{r.title}</b><small>{r.due}{r.doneAt?` · done ${r.doneAt}`:''}</small><p>{r.detail}</p>{r.link && <a className="pill" href={r.link} target={r.link.startsWith('#')?'_self':'_blank'}>{r.linkLabel || 'Open related document'}</a>}</span></label></div>)}</Card>
    <Card title="Add Custom Reminder" icon={<PlusCircle/>}><input placeholder="Reminder title" value={title} onChange={e=>setTitle(e.target.value)}/><input placeholder="Due date/time" value={due} onChange={e=>setDue(e.target.value)}/><textarea placeholder="Details" value={detail} onChange={e=>setDetail(e.target.value)}/><input placeholder="Optional document, route or web link" value={link} onChange={e=>setLink(e.target.value)}/><button onClick={addCustom}>Add reminder</button></Card>
  </section>
}
function Routes(){return <section className="grid"><Card title="Travel Route Centre" icon={<Train/>}><p>Start point for route cards: <b>{HOTEL}</b>. Platform and departure/arrival times should be checked live in Apple Maps on the day because train platforms and disruptions can change.</p><a className="pill" href={appleMaps(HOTEL)} target="_blank">Open hotel in Apple Maps</a></Card>{routeCards.map(r=><Card key={r.title} title={`${r.emoji} ${r.title}`} icon={<MapPin/>}><p><b>Date:</b> {r.date}</p><p><b>From:</b> {r.from}</p><p><b>To:</b> {r.to}</p><h3>Outbound plan</h3><ol>{r.baseline.map(x=><li key={x}>{x}</li>)}</ol><h3>Return plan</h3><ol>{r.returnRoute.map(x=><li key={x}>{x}</li>)}</ol><p><b>Departure/arrival/platform:</b> {r.timing}</p><div className="stampRow"><a className="pill" target="_blank" href={appleRoute(r.from,r.to)}>Live Apple Maps route</a>{r.docHref && <a className="pill" target="_blank" href={r.docHref}>{r.docs}</a>}<a className="pill" target="_blank" href={appleRoute(r.to,r.from)}>Return route</a></div></Card>)}</section>}
function LexieJournal({journal,rewards,photos,drawings}){
  const [selected,setSelected] = useState('pre');
  const selectedDay = selected==='pre' ? null : itinerary.find(i=>i.day===selected);
  const pages = [{key:'pre',label:'Before We Go',icon:'🎒'}, ...itinerary.map(i=>({key:i.day,label:`${i.day}: ${i.title}`,icon:i.icon}))];
  return <section className="grid">
    <Card title="Lexie’s Japan Adventure Book" icon={<BookOpen/>}><p>This is Lexie’s space. Dad or Mum can help type, upload photos, or save drawings from finger/Apple Pencil.</p><select value={selected} onChange={e=>setSelected(e.target.value)}>{pages.map(p=><option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}</select>{selected==='pre'?<PreTravelPage journal={journal} rewards={rewards}/>:<DailyJournalPage day={selectedDay} journal={journal} rewards={rewards}/>}</Card>
    <DrawingStudio drawings={drawings} rewards={rewards} page={selected}/>
    <PhotoUploader photos={photos} rewards={rewards} page={selected}/>
    <Card title="Saved Journal Pages" icon={<Sparkles/>}>{journal.items.length===0?<p>No journal entries yet.</p>:journal.items.map(e=><div className="note" key={e.id}><b>{e.emoji || '📖'} {e.page || e.place || 'Journal'}</b><small>{e.date || ''} · {e.mood || ''}</small><p>{e.text}</p>{e.why && <p><b>Why:</b> {e.why}</p>}</div>)}</Card>
  </section>
}
function PreTravelPage({journal,rewards}){
  const [excited,setExcited]=useState(''); const [why,setWhy]=useState(''); const [worried,setWorried]=useState(''); const [plan,setPlan]=useState('');
  async function save(){ await journal.add({page:'Before We Go', emoji:'🎒', text:excited, why, worried, plan, mood:'pre-travel', date:stampDate()}); await rewards.add({type:'journal', title:'Pre-travel journal star', detail:'Lexie wrote before the trip', date:stampDate(), value:1}); setExcited(''); setWhy(''); setWorried(''); setPlan(''); }
  return <div><h3>🎀 Before We Leave</h3><label>What are you looking forward to?</label><textarea value={excited} onChange={e=>setExcited(e.target.value)} placeholder="Example: I am excited about Disney, Hello Kitty, vending machines, trains..."/><label>Why are you looking forward to it?</label><textarea value={why} onChange={e=>setWhy(e.target.value)} placeholder="Because..."/><label>Is there anything you feel worried about?</label><textarea value={worried} onChange={e=>setWorried(e.target.value)} placeholder="Food, crowds, plane, getting lost, not knowing Japanese..."/><label>My confidence plan with Mum and Dad</label><textarea value={plan} onChange={e=>setPlan(e.target.value)} placeholder="I can ask Mum or Dad, use the translator, take a quiet break, have a snack, look at the route card..."/><button onClick={save}>Save pre-travel page and earn ⭐</button><div className="note"><b>Confidence Helper</b><p>Small plans help big adventures feel manageable: know where you are going, practise simple phrases, pack familiar snacks, and decide what to do if a place feels busy.</p></div></div>
}
function DailyJournalPage({day,journal,rewards}){
  const [text,setText]=useState(''); const [why,setWhy]=useState(''); const [mood,setMood]=useState('😊 Happy');
  if(!day) return null;
  async function save(){ await journal.add({page:`${day.day}: ${day.title}`, emoji:day.icon, text, why, mood, date:stampDate()}); await rewards.add({type:'journal', title:`${day.day} journal star`, detail:day.title, date:stampDate(), value:1}); setText(''); setWhy(''); }
  return <div><h3>{day.icon} {day.day}: {day.title}</h3><p>{day.activity}</p><label>Lexie prompt</label><textarea value={text} onChange={e=>setText(e.target.value)} placeholder={day.lexiePrompt}/><label>Why is this special or interesting?</label><textarea value={why} onChange={e=>setWhy(e.target.value)} placeholder="Write why, or Dad/Mum can help type it..."/><label>Mood</label><select value={mood} onChange={e=>setMood(e.target.value)}><option>😊 Happy</option><option>😍 Excited</option><option>😮 Amazed</option><option>🥰 Loved it</option><option>😴 Tired</option><option>😬 Nervous but brave</option></select><button onClick={save}>Save journal page and earn ⭐</button><p className="tiny">Dad/Mum note: {day.dadMum}</p></div>
}
function DrawingStudio({drawings,rewards,page}){
  const canvasRef = useRef(null); const [drawing,setDrawing] = useState(false); const [color,setColor] = useState('#ff70b7'); const [size,setSize]=useState(5); const [title,setTitle]=useState('Lexie drawing');
  function pos(e){ const c=canvasRef.current; const rect=c.getBoundingClientRect(); const t=e.touches?.[0] || e; return {x:(t.clientX-rect.left)*(c.width/rect.width), y:(t.clientY-rect.top)*(c.height/rect.height)}; }
  function start(e){ e.preventDefault(); setDrawing(true); const c=canvasRef.current; const ctx=c.getContext('2d'); const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); }
  function move(e){ if(!drawing) return; e.preventDefault(); const c=canvasRef.current; const ctx=c.getContext('2d'); const p=pos(e); ctx.lineTo(p.x,p.y); ctx.strokeStyle=color; ctx.lineWidth=size; ctx.lineCap='round'; ctx.stroke(); }
  function end(){ setDrawing(false); }
  function clear(){ const c=canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); }
  async function save(){ const dataUrl=canvasRef.current.toDataURL('image/png'); await drawings.add({page,title,url:dataUrl,date:stampDate()}); await rewards.add({type:'drawing', title:'Drawing star', detail:title, date:stampDate(), value:1}); }
  return <Card title="Draw with Finger or Apple Pencil" icon={<Palette/>}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Drawing title"/><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><label>Pen size</label><input type="range" min="2" max="20" value={size} onChange={e=>setSize(Number(e.target.value))}/></div><canvas ref={canvasRef} width="700" height="420" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} style={{width:'100%',height:260,border:'3px dashed #ffaad5',borderRadius:18,background:'#fff',touchAction:'none'}}></canvas><div className="stampRow"><button onClick={save}>Save drawing + ⭐</button><button onClick={clear}>Clear</button></div>{drawings.items.slice(0,3).map(d=><div className="note" key={d.id}><b>{d.title}</b><small>{d.date}</small><img src={d.url} alt={d.title} style={{width:'100%',borderRadius:14}}/></div>)}</Card>
}
function PhotoUploader({photos,rewards,page}){
  const [title,setTitle]=useState(''); const [busy,setBusy]=useState(false);
  async function upload(e){ const file=e.target.files?.[0]; if(!file) return; setBusy(true); try{ const path=`tripPhotos/${Date.now()}-${file.name}`; const ref=storageRef(storage,path); await uploadBytes(ref,file); const url=await getDownloadURL(ref); await photos.add({page,title:title||file.name,url,path,date:stampDate()}); await rewards.add({type:'photo', title:'Photo upload star', detail:title||file.name, date:stampDate(), value:1}); setTitle(''); } catch(err){ alert('Photo upload failed. Check Storage rules.'); console.error(err); } finally{ setBusy(false); } }
  return <Card title="Upload Photos" icon={<Camera/>}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Photo title"/><label className="pill" style={{display:'inline-block',cursor:'pointer'}}><Upload size={16}/> Choose photo<input type="file" accept="image/*" capture="environment" onChange={upload} style={{display:'none'}}/></label>{busy && <p>Uploading...</p>}{photos.items.filter(p=>p.page===page).slice(0,4).map(p=><div className="note" key={p.id}><b>{p.title}</b><small>{p.date}</small><img src={p.url} alt={p.title} style={{width:'100%',borderRadius:14}}/></div>)}</Card>
}
function Rewards({rewards,journal,photos,drawings}){
  const total = rewards.items.reduce((sum,r)=>sum+(Number(r.value)||1),0);
  const todayCount = rewards.items.filter(r=>new Date(r.date || Date.now()).toDateString()===new Date().toDateString()).length;
  const badges = [ ['5','First 5 Stars','🎀'], ['10','Phrase Learner','🇯🇵'], ['20','Photo Explorer','📸'], ['30','Disney Explorer','🏰'], ['40','Sanrio Superstar','🎀'], ['50','Japan Adventure Champion','🏆'] ];
  return <section className="grid"><Card title="Lexie’s Daily Rewards" icon={<Trophy/>}><div className="big">{todayCount}/5 today</div><p>Easy daily milestones: journal, photo, drawing, Japanese phrase, adventure prompt. More can still be logged as bonus stars.</p><div className="stampRow">{[1,2,3,4,5].map(n=><span key={n}>{todayCount>=n?'⭐':'☆'}</span>)}</div><p><b>Total stars:</b> {total}</p></Card><Card title="Badges" icon={<Star/>}>{badges.map(([need,name,emoji])=><div className="note" key={name}><b>{emoji} {name}</b><p>{total>=Number(need)?'Unlocked':'Needs '+need+' total stars'}</p></div>)}</Card><Card title="Reward History" icon={<BookOpen/>}>{rewards.items.length===0?<p>No rewards yet.</p>:rewards.items.map(r=><div className="note" key={r.id}><b>⭐ {r.title}</b><small>{r.date}</small><p>{r.detail}</p></div>)}</Card></section>
}
function JapaneseLessons({rewards}){
  async function complete(l){ say(l.ja); await rewards.add({type:'japanese', title:l.reward, detail:`Practised: ${l.en} / ${l.romaji}`, date:stampDate(), value:1}); }
  return <section className="grid"><Card title="Learn Basic Japanese" icon={<Languages/>}><p>Practise before departure. Each completed phrase earns Lexie a journal reward star.</p>{japaneseLessons.map(l=><button key={l.id} className="phrase" onClick={()=>complete(l)}><b>{l.level}: {l.en}</b><span>{l.ja}</span><small>{l.romaji} · tap to hear and earn ⭐</small></button>)}</Card><Card title="Phrase Challenge" icon={<Trophy/>}><ul><li>Learn 3 phrases before leaving Australia.</li><li>Use “arigatou” in a shop.</li><li>Ask “ikura desu ka?” when shopping.</li><li>Use “sumimasen” before asking for help.</li></ul></Card></section>
}
function Emergency(){return <section className="grid"><Card title="Emergency & Local Contacts" icon={<Shield/>}><p>Save this tab to the home screen and keep screenshots in Apple Photos.</p>{emergencyContacts.map(c=><div className="note" key={c.name}><b>{c.name}</b><p>{c.detail}</p>{c.type==='call' && c.number && <a className="pill" href={callLink(c.number)}><PhoneCall size={16}/> Call {c.number}</a>}{c.type==='map' && <a className="pill" href={appleMaps(c.map)} target="_blank"><MapPin size={16}/> Open in Apple Maps</a>}</div>)}</Card><Card title="Lexie Help Card" icon={<Heart/>}><p><b>English:</b> My name is Lexie. I am travelling with my Mum and Dad. Please help me call them.</p><p><b>Japanese:</b> 私の名前はレクシーです。お母さんとお父さんと旅行しています。電話するのを手伝ってください。</p><button onClick={()=>say('私の名前はレクシーです。お母さんとお父さんと旅行しています。電話するのを手伝ってください。')}>Speak help card</button><textarea placeholder="Add Dad phone, Mum phone, hotel room, insurance policy number here..." /></Card></section>}
function Food(){return <section className="grid"><Card title="Dad & Mum Vegetarian Mode" icon={<Utensils/>}><p>Watch for hidden dashi, fish stock, chicken broth and meat extracts.</p><ul><li>T’s TanTan near Tokyo Station</li><li>Ain Soph locations</li><li>Vegetarian curry where confirmed</li><li>Carry snacks for Fuji and Sumo days</li></ul></Card><Card title="Lexie Plain-Food Mode" icon={<Utensils/>}><p>Lexie is not vegetarian. She likes simple food with no sauce or strong flavours.</p><ul><li>Chicken nuggets</li><li>Hot chips/fries</li><li>Chicken noodles</li><li>Plain pasta with no sauce</li><li>Pizza, toast, ice cream, pancakes</li></ul></Card>{places.map(p=><Card key={p.name} title={`${p.emoji} ${p.name}`} icon={<MapPin/>}><p><b>Lexie-friendly ideas:</b></p><ul>{p.lexieFood.map(f=><li key={f}>{f}</li>)}</ul><a className="pill" target="_blank" href={appleMaps(`${p.name} McDonald's KFC fries noodles`) }>Find simple food nearby</a></Card>)}</section>}
function Translator(){return <section className="grid"><Card title="Voice Translator" icon={<Mic/>}><p>Tap a phrase to speak it in Japanese. Saved phrase cards still show offline.</p>{japaneseLessons.map(l=><button key={l.id} className="phrase" onClick={()=>say(l.ja)}><b>{l.en}</b><span>{l.ja}</span><small>{l.romaji}</small></button>)}</Card><Card title="Visual Translator Helper" icon={<Camera/>}><p>For full camera translation, download Japanese in Apple Translate or Google Translate before departure. Use this app to store translated notes and phrase practice.</p></Card></section>}
function Currency({aud,setAud,jpy,setJpy}){return <section className="grid"><Card title="Offline AUD ⇄ JPY Converter" icon={<Wallet/>}><p>Last known rate: 1 AUD ≈ ¥{AUD_TO_JPY.toFixed(3)} JPY.</p><label>AUD</label><input type="number" value={aud} onChange={e=>{const v=Number(e.target.value); setAud(v); setJpy(Math.round(v*AUD_TO_JPY))}}/><label>JPY</label><input type="number" value={jpy} onChange={e=>{const v=Number(e.target.value); setJpy(v); setAud((v/AUD_TO_JPY).toFixed(2))}}/><p className="big">${aud} ≈ ¥{Number(jpy).toLocaleString()}</p></Card></section>}
function Phone(){return <section className="grid"><Card title="Access on iPhone/iPad" icon={<Smartphone/>}><ol><li>Deploy this repo to Vercel.</li><li>Open the Vercel link in Safari.</li><li>Tap Share.</li><li>Tap Add to Home Screen.</li><li>Open it from the new icon.</li></ol></Card><Card title="Apple Maps Offline" icon={<MapPin/>}><ol><li>Open Apple Maps.</li><li>Tap your picture/initials.</li><li>Tap Offline Maps.</li><li>Add Tokyo, Narita, Disney/Maihama, Tama Center and Fuji/Kawaguchiko.</li><li>Check live routes before travel when internet is available.</li></ol></Card><Card title="ALDI Prepaid SIM Notes" icon={<Smartphone/>}><ul><li>Turn on international roaming before leaving Australia.</li><li>Expect mobile data to cost more overseas.</li><li>Use hotel Wi-Fi where possible.</li><li>Download offline maps and translator language packs before departure.</li><li>Keep screenshots/PDFs of tickets in Apple Files and Photos as backup.</li></ul></Card></section>}
function AddInfo({notes,photos}){const [title,setTitle]=useState(''); const [body,setBody]=useState(''); async function add(){if(!title&&!body)return; await notes.add({title,body,date:stampDate()}); setTitle(''); setBody('')} return <section className="grid"><Card title="Add New Information" icon={<PlusCircle/>}><input placeholder="Title, booking, restaurant, reminder..." value={title} onChange={e=>setTitle(e.target.value)}/><textarea placeholder="Paste details, translated text, notes, reminders or travel tips..." value={body} onChange={e=>setBody(e.target.value)}/><button onClick={add}>Save and sync</button></Card><Card title="Saved Notes" icon={<BookOpen/>}>{notes.items.length===0?<p>No notes yet.</p>:notes.items.map(n=><div className="note" key={n.id}><b>{n.title}</b><small>{n.date}</small><p>{n.body}</p></div>)}</Card></section>}

createRoot(document.getElementById('root')).render(<App/>);

if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{})); }
