
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে।');
    } catch (err: any) {
      setError('ইমেইলটি সঠিক নয় অথবা সিস্টেমে নেই।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
      <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-800 mb-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">পাসওয়ার্ড রিসেট</h1>
          <p className="text-slate-400">আপনার রেজিস্টারড ইমেইল দিন</p>
        </div>

        {message && <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg text-sm text-center">{message}</div>}
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none"
            placeholder="example@gmail.com"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিঙ্ক পাঠান'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white">লগইন পেজে ফিরুন</Link>
        </div>
      </div>
      <div className="text-center">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Developed by Arefin Foysal</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
