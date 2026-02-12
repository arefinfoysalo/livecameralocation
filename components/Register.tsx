
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../firebase';
// Fix: Use ESM URL for react-router-dom to resolve "no exported member" errors.
import { Link, useNavigate } from 'https://esm.sh/react-router-dom@6';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Username validation: no spaces
    if (username.includes(' ')) {
      setError('ইউজারনেমে কোনো স্পেস থাকা যাবে না।');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });
      
      // Store additional user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        username: username.toLowerCase(),
        createdAt: new Date().toISOString()
      });

      await sendEmailVerification(user);
      alert('আপনার ইমেইলে একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে। ভেরিফাই করার পর লগইন করুন।');
      navigate('/login');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('এই জিমেইলটি ইতিমধ্যেই ব্যবহার করা হয়েছে।');
      } else {
        setError('রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md premium-card p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">রেজিস্ট্রেশন</h2>
        <p className="text-center text-gray-500 mb-8">নতুন অ্যাকাউন্ট খুলুন</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পুরো নাম</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Arefin Foysal"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল ঠিকানা</label>
            <input 
              type="email" 
              required 
              placeholder="example@gmail.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ইউজারনেম (স্পেস ছাড়া)</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. arefinfoysal"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 mt-4"
          >
            {loading ? "প্রসেসিং..." : "রেজিস্ট্রেশন করুন"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">ইতিমধ্যেই অ্যাকাউন্ট আছে? <Link to="/login" className="text-blue-600 font-semibold hover:underline">লগইন করুন</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
