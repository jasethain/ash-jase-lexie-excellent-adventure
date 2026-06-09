import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  MapPin, Mic, Camera, Wallet, BookOpen, Utensils, Train, PlusCircle,
  Smartphone, Sparkles, Heart, Download, Star, Cloud, CloudOff, Trash2,
  ShoppingBag, CheckCircle2, Image as ImageIcon, ReceiptText
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp, enableIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './styles.css';

const firebaseConfig = {
  apiKey: 'AIzaSyDmlH6crdNzfmEO-vr-zLr3KOjp857HN60',
  authDomain: 'ajl-japan-adventure.firebaseapp.com',
  projectId: 'ajl-japan-adventure',
  storageBucket: 'ajl-japan-adventure.firebasestorage.app',
  messagingSenderId: '241722632776',
  appId: '1:241722632776:web:0a7b4ec866641bfd78467d'
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

enableIndexedDbPersistence(db).catch(() => {
  // Safe to ignore. Another browser tab may already own persistence.
});

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
  { name:'Harajuku', type:'spare time', emoji:'🌸', prompts:['Cutest thing seen?', 'Best shop?', 'Best photo booth?', 'Favourite sweet treat?'], lexieFood:["McDonald's/KFC style backup", 'Crepes without sauce', 'Plain chips', 'Ice cream'] },
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

const starterChecklist = [
  'Passports and visas checked',
  'Travel insurance saved offline',
  'Apple Maps offline Tokyo/Narita/Disney/Puroland/Fuji areas downloaded',
  'Japanese language pack downloaded in translation app',
  'ALDI roaming checked before leaving Australia',
  'Vegetarian meal requests confirmed',
  'Lexie plain-food snack backup packed'
];

function say(text){
  if(!('speechSynthesis' in window)) return alert('Speech is not available on this device/browser.');
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  speechSynthesis.speak(u);
}

function appleMaps(query){
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function stampDate(value){
  if (!value) return '';
  if (value.seconds) return new Date(value.seconds * 1000).toLocaleString();
  return String(value);
}

function useFirebaseAuth(){
  const [user,setUser] = useState(null);
  const [status,setStatus] = useState('Connecting');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setStatus('Synced');
        return;
      }
      try {
        setStatus('Signing in');
        await signInAnonymously(auth);
      } catch (error) {
        console.error(error);
        setStatus('Offline/local only');
      }
    });
    return unsub;
  }, []);

  return { user, status };
}

function useSyncedCollection(name, seed = []){
  const [items,setItems] = useState(seed);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, name), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(rows.length ? rows : seed);
      setLoading(false);
      setError('');
    }, (err) => {
      console.error(err);
      setError(err.message || 'Sync error');
      setLoading(false);
    });
    return unsub;
  }, [name]);

  async function addItem(data){
    await addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() });
  }

  async function removeItem(id){
    await deleteDoc(doc(db, name, id));
  }

  return { items, loading, error, addItem, removeItem };
}

async function uploadTripFile(file, folder='uploads'){
  if (!file) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

function App(){
  const { user, status } = useFirebaseAuth();
  const [tab,setTab] = useState('home');
  const [aud,setAud] = useState(50);
  const [jpy,setJpy] = useState(Math.round(50*AUD_TO_JPY));
  const nextTrip = Math.ceil((new Date('2026-07-01T09:00:00')-today)/(1000*60*60*24));

  const journal = useSyncedCollection('journalEntries');
  const notes = useSyncedCollection('tripNotes');
  const checklist = useSyncedCollection('checklistItems', starterChecklist.map((text, idx) => ({ id:`starter-${idx}`, text, done:false, starter:true })));
  const shopping = useSyncedCollection('shoppingItems');
  const expenses = useSyncedCollection('expenses');
  const photos = useSyncedCollection('tripPhotos');

  const tabs = [
    ['home','Home','🎀'],['itinerary','Trip','🗓️'],['maps','Apple Maps','🗺️'],
    ['journal','Lexie Journal','📖'],['food','Food','🍟'],['photos','Photos','📸'],
    ['lists','Lists','☑️'],['money','Money','💴'],['translate','Translator','🎤'],
    ['phone','Apple Devices','📱'],['add','Add Info','➕']
  ];

  return <div className="app">
    <div className="sakura"></div><div className="bows"></div>
    <header>
      <div className="kitty">🎀</div>
      <div>
        <h1>Ash, Jase & Lexie's Excellent Adventure</h1>
        <p>Hello Kitty inspired Japan companion, synced with Firebase for iPhone/iPad</p>
      </div>
      <div className="syncBadge" title={user?.uid || 'No user yet'}>{status === 'Synced' ? <Cloud size={18}/> : <CloudOff size={18}/>} {status}</div>
    </header>
    <nav>{tabs.map(t=><button key={t[0]} onClick={()=>setTab(t[0])} className={tab===t[0]?'active':''}><span>{t[2]}</span>{t[1]}</button>)}</nav>
    <main>
      {tab==='home' && <Home nextTrip={nextTrip} journal={journal.items} notes={notes.items} photos={photos.items} checklist={checklist.items} expenses={expenses.items} />}
      {tab==='itinerary' && <Timeline />}
      {tab==='maps' && <Maps />}
      {tab==='journal' && <Journal journal={journal} />}
      {tab==='food' && <Food />}
      {tab==='photos' && <Photos photos={photos} />}
      {tab==='lists' && <Lists checklist={checklist} shopping={shopping} />}
      {tab==='translate' && <Translator />}
      {tab==='money' && <Currency aud={aud} setAud={setAud} jpy={jpy} setJpy={setJpy} expenses={expenses} />}
      {tab==='phone' && <Phone />}
      {tab==='add' && <AddInfo notes={notes} />}
    </main>
  </div>;
}

function Card({title,icon,children}){return <article className="card"><h2>{icon}{title}</h2>{children}</article>}

function Home({ nextTrip, journal, notes, photos, checklist, expenses }){
  const totalJpy = expenses.reduce((sum, e) => sum + Number(e.jpy || 0), 0);
  const nextItem = itinerary.find(x => new Date(`${x.date.replace('Jul','July')} 2026`).getTime() >= Date.now()) || itinerary[0];
  return <section className="grid">
    <Card title="Tokyo Countdown" icon={<Sparkles/>}><div className="big">{nextTrip>0?nextTrip:'Trip time!'} days</div><p>Pack passports, insurance, chargers, Apple Maps offline areas and Lexie's snack backup.</p></Card>
    <Card title="Trip Control Centre" icon={<Heart/>}><p><b>Next adventure:</b> {nextItem.icon} {nextItem.title}</p><p><b>Shared notes:</b> {notes.length}</p><p><b>Journal stamps:</b> {journal.length}</p><p><b>Photos:</b> {photos.length}</p><p><b>Checklist items:</b> {checklist.length}</p><p><b>Spend tracked:</b> ¥{totalJpy.toLocaleString()} / ${(totalJpy/AUD_TO_JPY).toFixed(2)} AUD</p></Card>
    <Card title="Booking Wallet" icon={<Download/>}><a href="/assets/Qantas_E_Ticket_DQ3AT8.pdf">Open Qantas e-ticket PDF</a><a href="/assets/Tokyo_Meeting_Point.jpg">Open Fuji meeting point image</a></Card>
  </section>;
}

function Timeline(){return <section className="timeline">{itinerary.map(i=><article className="event" key={i.title}><div className="date">{i.date}</div><div className="bubble">{i.icon}</div><div><h2>{i.title}</h2><p><MapPin size={16}/> {i.location}</p><p>{i.notes}</p><a className="pill" href={appleMaps(i.apple)} target="_blank">Open in Apple Maps</a></div></article>)}</section>}

function Maps(){return <section className="grid"><Card title="Apple Maps Setup" icon={<MapPin/>}><ol><li>Open Apple Maps before the trip.</li><li>Search Tokyo and choose Download Map.</li><li>Also download Narita, Maihama/Disney, Tama Center/Puroland and Mount Fuji/Kawaguchiko.</li><li>Save hotel, airport, Disney, Puroland and Fuji meeting point as favourites.</li></ol></Card>{itinerary.filter(x=>x.apple).map(i=><Card key={i.title} title={i.title} icon={<Train/>}><p>{i.location}</p><a className="pill" target="_blank" href={appleMaps(i.apple)}>Navigate with Apple Maps</a><p className="tiny">Offline maps are managed inside Apple Maps, not bundled in this app.</p></Card>)}</section>}

function Journal({ journal }){
  const [place,setPlace]=useState(places[0].name);
  const [mood,setMood]=useState('😊 Happy');
  const [text,setText]=useState('');
  const [author,setAuthor]=useState('Lexie');
  const [file,setFile]=useState(null);
  const [busy,setBusy]=useState(false);
  const current=places.find(p=>p.name===place);

  async function add(){
    setBusy(true);
    try {
      const imageUrl = file ? await uploadTripFile(file, 'journal') : '';
      await journal.addItem({ place, mood, text, author, imageUrl, emoji:current.emoji });
      setText(''); setFile(null);
    } finally { setBusy(false); }
  }

  return <section className="grid">
    <Card title="Lexie’s Location-Aware Journal" icon={<BookOpen/>}>
      <label>Who is adding this?</label><select value={author} onChange={e=>setAuthor(e.target.value)}><option>Lexie</option><option>Ash</option><option>Jase</option></select>
      <label>Where are you?</label><select value={place} onChange={e=>setPlace(e.target.value)}>{places.map(p=><option key={p.name}>{p.name}</option>)}</select>
      <div className="placeHero">{current.emoji} {current.name}</div><p>Prompts:</p><ul>{current.prompts.map(p=><li key={p}>{p}</li>)}</ul>
      <label>Mood</label><select value={mood} onChange={e=>setMood(e.target.value)}><option>😊 Happy</option><option>😍 Excited</option><option>😮 Amazed</option><option>🥰 Loved it</option><option>😴 Tired</option></select>
      <textarea placeholder="Lexie's memory, or Jase/Ash can type it for her..." value={text} onChange={e=>setText(e.target.value)} />
      <label>Add photo</label><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
      <button disabled={busy} onClick={add}>{busy ? 'Saving...' : 'Add synced journal stamp'}</button>
    </Card>
    <Card title="Treasure Hunt" icon={<Star/>}><ul className="hunt"><li>📸 Find Hello Kitty</li><li>🚆 Ride a Tokyo train</li><li>🍦 Try Japanese ice cream</li><li>🏰 Find Mickey</li><li>🗻 Spot Mount Fuji</li><li>🎀 Take a cute shop photo</li></ul></Card>
    <Card title="Synced Journal Entries" icon={<Sparkles/>}>{journal.items.length===0?<p>No entries yet.</p>:journal.items.map(e=><div className="note" key={e.id}><b>{e.emoji} {e.place}</b><small>{stampDate(e.createdAt)} · {e.mood} · {e.author || 'Family'}</small>{e.imageUrl && <img className="photoThumb" src={e.imageUrl} alt="Journal"/>}<p>{e.text || 'Quick stamp added.'}</p>{!e.starter && <button className="danger" onClick={()=>journal.removeItem(e.id)}><Trash2 size={14}/> Delete</button>}</div>)}</Card>
  </section>;
}

function Food(){return <section className="grid"><Card title="Jase & Ash Vegetarian Mode" icon={<Utensils/>}><p>Watch for hidden dashi, fish stock, chicken broth and meat extracts.</p><ul><li>T’s TanTan near Tokyo Station</li><li>Ain Soph locations</li><li>Vegetarian curry where confirmed</li><li>Carry snacks for Fuji and Sumo days</li></ul></Card><Card title="Lexie Plain-Food Mode" icon={<Utensils/>}><p>Lexie is not vegetarian. She likes basic food with no sauce or strong flavours.</p><ul><li>Chicken nuggets</li><li>Hot chips/fries</li><li>Chicken noodles</li><li>Plain pasta with no sauce</li><li>Pizza, toast, ice cream, pancakes</li></ul></Card>{places.map(p=><Card key={p.name} title={`${p.emoji} ${p.name}`} icon={<MapPin/>}><p><b>Lexie-friendly ideas:</b></p><ul>{p.lexieFood.map(f=><li key={f}>{f}</li>)}</ul><a className="pill" target="_blank" href={appleMaps(`${p.name} McDonald's KFC fries noodles`) }>Find simple food nearby</a></Card>)}</section>}

function Photos({ photos }){
  const [file,setFile] = useState(null);
  const [caption,setCaption] = useState('');
  const [author,setAuthor] = useState('Jase');
  const [busy,setBusy] = useState(false);
  async function addPhoto(){
    if (!file) return alert('Choose a photo first.');
    setBusy(true);
    try {
      const imageUrl = await uploadTripFile(file, 'photos');
      await photos.addItem({ imageUrl, caption, author });
      setFile(null); setCaption('');
    } finally { setBusy(false); }
  }
  return <section className="grid">
    <Card title="Shared Photo Scrapbook" icon={<Camera/>}><label>Who is uploading?</label><select value={author} onChange={e=>setAuthor(e.target.value)}><option>Jase</option><option>Ash</option><option>Lexie</option></select><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} /><input placeholder="Caption" value={caption} onChange={e=>setCaption(e.target.value)} /><button disabled={busy} onClick={addPhoto}>{busy ? 'Uploading...' : 'Upload photo'}</button></Card>
    <Card title="Family Photo Wall" icon={<ImageIcon/>}>{photos.items.length===0?<p>No photos yet.</p>:<div className="photoGrid">{photos.items.map(p=><div className="photoCard" key={p.id}><img src={p.imageUrl} alt={p.caption || 'Trip'} /><b>{p.caption || 'Trip photo'}</b><small>{p.author || 'Family'} · {stampDate(p.createdAt)}</small><button className="danger" onClick={()=>photos.removeItem(p.id)}><Trash2 size={14}/> Delete</button></div>)}</div>}</Card>
  </section>;
}

function Lists({ checklist, shopping }){
  return <section className="grid"><Checklist collection={checklist}/><Shopping collection={shopping}/></section>;
}

function Checklist({ collection }){
  const [text,setText] = useState('');
  async function add(){ if(!text.trim()) return; await collection.addItem({ text, done:false }); setText(''); }
  return <Card title="Shared Checklist" icon={<CheckCircle2/>}><input placeholder="Add checklist item" value={text} onChange={e=>setText(e.target.value)} /><button onClick={add}>Add</button>{collection.items.map(item=><div className="note" key={item.id}><b>{item.done ? '✅' : '☐'} {item.text}</b><small>{item.starter ? 'Starter item' : stampDate(item.createdAt)}</small>{!item.starter && <button className="danger" onClick={()=>collection.removeItem(item.id)}><Trash2 size={14}/> Delete</button>}</div>)}</Card>
}

function Shopping({ collection }){
  const [text,setText] = useState(''); const [person,setPerson] = useState('Lexie');
  async function add(){ if(!text.trim()) return; await collection.addItem({ text, person }); setText(''); }
  return <Card title="Japan Shopping List" icon={<ShoppingBag/>}><select value={person} onChange={e=>setPerson(e.target.value)}><option>Lexie</option><option>Ash</option><option>Jase</option><option>Family</option></select><input placeholder="Hello Kitty plush, guitar picks, snacks..." value={text} onChange={e=>setText(e.target.value)} /><button onClick={add}>Add shopping item</button>{collection.items.length===0?<p>No shopping items yet.</p>:collection.items.map(item=><div className="note" key={item.id}><b>{item.person}: {item.text}</b><small>{stampDate(item.createdAt)}</small><button className="danger" onClick={()=>collection.removeItem(item.id)}><Trash2 size={14}/> Delete</button></div>)}</Card>
}

function Translator(){return <section className="grid"><Card title="Voice Translator" icon={<Mic/>}><p>Tap a phrase to speak it in Japanese. Works best online, but saved phrase cards work offline.</p>{phrases.map(([en,ja,ro])=><button key={en} className="phrase" onClick={()=>say(ja)}><b>{en}</b><span>{ja}</span><small>{ro}</small></button>)}</Card><Card title="Visual Translator Helper" icon={<Camera/>}><p>Offline camera translation cannot be fully built into a small web app. Use this workflow:</p><ol><li>Open Apple Translate or Google Translate app.</li><li>Download Japanese offline language pack before leaving.</li><li>Use camera mode on menus, signs and tickets.</li></ol><p>This app stores translated notes in Add Info.</p></Card></section>}

function Currency({aud,setAud,jpy,setJpy,expenses}){
  const [label,setLabel] = useState(''); const [amount,setAmount] = useState(''); const [person,setPerson] = useState('Family');
  async function addExpense(){ const value=Number(amount); if(!label || !value) return; await expenses.addItem({ label, jpy:value, aud:Number((value/AUD_TO_JPY).toFixed(2)), person }); setLabel(''); setAmount(''); }
  const totalJpy = expenses.items.reduce((sum,e)=>sum+Number(e.jpy||0),0);
  return <section className="grid"><Card title="Offline AUD ⇄ JPY Converter" icon={<Wallet/>}><p>Last known rate: 1 AUD ≈ ¥{AUD_TO_JPY.toFixed(3)} JPY.</p><label>AUD</label><input type="number" value={aud} onChange={e=>{const v=Number(e.target.value); setAud(v); setJpy(Math.round(v*AUD_TO_JPY))}}/><label>JPY</label><input type="number" value={jpy} onChange={e=>{const v=Number(e.target.value); setJpy(v); setAud((v/AUD_TO_JPY).toFixed(2))}}/><p className="big">${aud} ≈ ¥{Number(jpy).toLocaleString()}</p></Card><Card title="Shared Spending Tracker" icon={<ReceiptText/>}><select value={person} onChange={e=>setPerson(e.target.value)}><option>Family</option><option>Jase</option><option>Ash</option><option>Lexie</option></select><input placeholder="What was it?" value={label} onChange={e=>setLabel(e.target.value)} /><input placeholder="Amount in JPY" type="number" value={amount} onChange={e=>setAmount(e.target.value)} /><button onClick={addExpense}>Add expense</button><p><b>Total:</b> ¥{totalJpy.toLocaleString()} / ${(totalJpy/AUD_TO_JPY).toFixed(2)} AUD</p>{expenses.items.map(e=><div className="note" key={e.id}><b>{e.label}</b><small>{e.person} · ¥{Number(e.jpy).toLocaleString()} / ${Number(e.aud).toFixed(2)} AUD · {stampDate(e.createdAt)}</small><button className="danger" onClick={()=>expenses.removeItem(e.id)}><Trash2 size={14}/> Delete</button></div>)}</Card></section>;
}

function Phone(){return <section className="grid"><Card title="Access on iPhone/iPad" icon={<Smartphone/>}><ol><li>Deploy this repo to Vercel.</li><li>Open the Vercel link in Safari.</li><li>Tap Share.</li><li>Tap Add to Home Screen.</li><li>Open it from the new icon.</li></ol></Card><Card title="ALDI Prepaid SIM Notes" icon={<Smartphone/>}><ul><li>Turn on international roaming before leaving Australia.</li><li>Expect mobile data to cost more overseas.</li><li>Use hotel Wi-Fi where possible.</li><li>Download Apple Maps offline areas and translator language packs before departure.</li><li>Keep screenshots/PDFs of tickets in Apple Files and Photos as backup.</li></ul></Card></section>}

function AddInfo({ notes }){
  const [title,setTitle]=useState(''); const [body,setBody]=useState(''); const [author,setAuthor]=useState('Jase');
  async function add(){ if(!title&&!body)return; await notes.addItem({ title, body, author }); setTitle(''); setBody(''); }
  return <section className="grid"><Card title="Add New Information" icon={<PlusCircle/>}><select value={author} onChange={e=>setAuthor(e.target.value)}><option>Jase</option><option>Ash</option><option>Lexie</option></select><input placeholder="Title, booking, restaurant, reminder..." value={title} onChange={e=>setTitle(e.target.value)}/><textarea placeholder="Paste details, translated text, notes, reminders or travel tips..." value={body} onChange={e=>setBody(e.target.value)}/><button onClick={add}>Save and sync</button><p className="tiny">Saved to Firebase so everyone sees it.</p></Card><Card title="Synced Notes" icon={<BookOpen/>}>{notes.items.length===0?<p>No notes yet.</p>:notes.items.map(n=><div className="note" key={n.id}><b>{n.title}</b><small>{n.author || 'Family'} · {stampDate(n.createdAt)}</small><p>{n.body}</p><button className="danger" onClick={()=>notes.removeItem(n.id)}><Trash2 size={14}/> Delete</button></div>)}</Card></section>;
}

createRoot(document.getElementById('root')).render(<App/>);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
