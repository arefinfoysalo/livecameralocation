
import React, { useState, useEffect } from 'react';
// Fix: Use ESM URL for react-router-dom to resolve "no exported member" errors.
import { Routes, Route, useNavigate, Navigate } from 'https://esm.sh/react-router-dom@6';
import { onAuthStateChanged, User, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Fix: Correct path to firebase.ts which is in the parent directory.
import { auth } from '../firebase';
// Fix: Correct relative paths for components in the same directory.
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import Dashboard from './Dashboard';
import TrackPage from './TrackPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        // If logged in but not verified, we'll let Login component handle the message
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
      <Route path="/trk/:id" element={<TrackPage />} />
      {/* Fix: Navigate 'to' prop does not accept a callback. Serving TrackPage directly for this path alias. */}
      <Route path="/track/:id" element={<TrackPage />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};

export default App;
