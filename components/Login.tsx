
import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from '../firebase';
// Fix: Use ESM URL for react-router-dom to resolve "no exported member" errors.
import { Link, useNavigate } from 'https://esm.sh/react-router-dom@6';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError('আপনার ইমেইল ভেরিফাই করা নেই। দয়া করে ইমেইল চেক করুন।');
        await signOut(auth);
        setLoading(false);
        return;
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError('ইমেইল বা পাসওয়ার্ড ভুল অথবা অ্যাকাউন্টটি নিবন্ধিত নয়।');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md premium-card p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">লগইন করুন</h2>
        <p className="text-center text-gray-500 mb-8">আপনার তথ্য দিয়ে প্রবেশ করুন</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 font-bold">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল ঠিকানা</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? "লুকান" : "দেখুন"}
            </button>
          </div>

          <div className="flex items-center justify-between">
            {/* Fix: Removed invalid 'size' attribute from the Link component */}
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">পাসওয়ার্ড ভুলে গেছেন?</Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50"
          >
            {loading ? "লোডিং..." : "লগইন"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-600">নতুন অ্যাকাউন্ট তৈরি করতে চান?</p>
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">রেজিস্ট্রেশন করুন</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
