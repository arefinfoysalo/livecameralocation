
import React, { useState } from 'react';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from '../firebase';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      setLoading(false);
    } catch (err: any) {
      setError('ইমেইলটি সঠিক নয় অথবা কোনো সমস্যা হয়েছে।');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md premium-card p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">পাসওয়ার্ড রিসেট</h2>
        <p className="text-center text-gray-500 mb-8">আপনার ইমেইল দিন, আমরা লিংক পাঠাবো</p>
        
        {sent ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
            <p className="font-medium">আপনার ইমেইলে একটি রিসেট লিংক পাঠানো হয়েছে। চেক করুন।</p>
            <Link to="/login" className="block mt-4 text-blue-600 font-bold hover:underline">লগইন পেজে ফিরে যান</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            {error && <div className="text-red-500 text-sm">{error}</div>}
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
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50"
            >
              {loading ? "পাঠানো হচ্ছে..." : "রিসেট লিংক পাঠান"}
            </button>
            <div className="text-center">
               <Link to="/login" className="text-blue-600 text-sm hover:underline">লগইন করুন</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
