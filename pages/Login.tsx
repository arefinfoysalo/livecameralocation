import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; // signOut ইম্পোর্ট করা হয়েছে
import { auth, db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let emailToLogin = identifier;
      
      // ১. ইউজারনেম দিয়ে ইমেইল খুঁজে বের করা
      if (!identifier.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', identifier.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('ইউজারনেম খুঁজে পাওয়া যায়নি');
        }
        emailToLogin = querySnapshot.docs[0].data().email;
      }

      // ২. ফায়ারবেস অথ দিয়ে লগইন চেষ্টা
      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      const user = userCredential.user;

      // ৩. ইমেইল ভেরিফিকেশন চেক (আপনার কাঙ্ক্ষিত পরিবর্তন)
      if (!user.emailVerified) {
        await signOut(auth); // ভেরিফাইড না থাকলে সেশন আউট করে দিন
        setError('আপনার ইমেইলটি এখনো ভেরিফাই করা হয়নি। দয়া করে ইনবক্স চেক করে লিঙ্কটি কনফার্ম করুন।');
        setLoading(false);
        return; 
      }

      // ৪. সবকিছু ঠিক থাকলে ড্যাশবোর্ডে রিডাইরেক্ট
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'লগইন ব্যর্থ হয়েছে। তথ্য চেক করুন।';
      if (err.message.includes('auth/wrong-password')) errorMessage = 'ভুল পাসওয়ার্ড!';
      if (err.message.includes('auth/user-not-found')) errorMessage = 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট নেই।';
      setError(err.message === 'ইউজারনেম খুঁজে পাওয়া যায়নি' ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
      <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-800 mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            স্বাগতম ফিরে আসার জন্য
          </h1>
          <p className="text-slate-400">আপনার অ্যাকাউন্ট দিয়ে লগইন করুন</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">ইমেইল অথবা ইউজারনেম</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="arefinfoysal"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">পাসওয়ার্ড</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" title="পাসওয়ার্ড ভুলে গেছেন?" className="text-sm text-blue-400 hover:text-blue-300 transition">
              পাসওয়ার্ড ভুলে গেছেন?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'লগইন করুন'}
          </button>
        </form>

        <div className="text-center text-slate-400 text-sm">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/register" className="text-blue-400 font-medium hover:underline">
            রেজিস্ট্রেশন করুন
          </Link>
        </div>
      </div>
      <div className="text-center">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Developed by Arefin Foysal</p>
      </div>
    </div>
  );
};

export default Login;
