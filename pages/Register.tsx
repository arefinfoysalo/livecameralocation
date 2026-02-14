import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile, signOut } from 'firebase/auth'; // signOut যোগ করা হয়েছে
import { auth, db } from '../firebase';
import { setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'username' ? value.replace(/\s+/g, '').toLowerCase() : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Check if username exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', formData.username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে।');
      }

      // 2. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 3. Update Profile
      await updateProfile(user, { displayName: formData.fullName });

      // 4. Save extra info to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        createdAt: new Date().toISOString(),
        logsCount: 0
      });

      // 5. Send Verification Email
      await sendEmailVerification(user);

      // --- এখানে পরিবর্তন ---
      // ৬. ইউজারকে অটো-লগইন থেকে বের করে দিন
      await signOut(auth); 
      
      alert('রেজিস্ট্রেশন সফল! আপনার ইমেইল চেক করে ভেরিফাই করুন, তারপর লগইন করুন।');
      navigate('/login');
      // --------------------

    } catch (err: any) {
      setError(err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
      <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl space-y-6 border border-slate-800 mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            নতুন অ্যাকাউন্ট খুলুন
          </h1>
          <p className="text-slate-400">নিচের তথ্যগুলো পূরণ করুন</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">পুরো নাম</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Arefin Foysal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">ইমেইল ঠিকানা</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">ইউজারনেম (স্পেস ছাড়া)</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="arefinfoysal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">পাসওয়ার্ড</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-50 hover:to-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'রেজিস্ট্রেশন সফল করুন'}
          </button>
        </form>

        <div className="text-center text-slate-400 text-sm">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="text-blue-400 font-medium hover:underline">
            লগইন করুন
          </Link>
        </div>
      </div>
      <div className="text-center">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Developed by Arefin Foysal</p>
      </div>
    </div>
  );
};

export default Register;
