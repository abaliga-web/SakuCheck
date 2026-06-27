import React, { useCallback, useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, Camera, Aperture } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File | null) => void;
  selectedImage: File | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, selectedImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Attach stream to video element when camera opens
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = mediaStream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert('カメラへのアクセスが拒否されたか、利用できません。(Camera access denied or unavailable.)');
    }
  };

  const processFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    } else {
      alert('画像ファイルを選択してください。(Please select an image file.)');
    }
  }, [onImageSelect]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            processFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  }, [stopCamera, processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isCameraOpen) setIsDragging(true);
  }, [isCameraOpen]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isCameraOpen) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile, isCameraOpen]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const clearImage = useCallback(() => {
    onImageSelect(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [onImageSelect]);

  if (selectedImage && previewUrl) {
    return (
      <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-agri-200 shadow-sm group">
        <img src={previewUrl} alt="Selected crop" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-agri-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
          <button
            onClick={clearImage}
            className="bg-white text-red-600 p-2.5 rounded-full hover:bg-red-50 transition-colors flex items-center gap-2 px-5 font-bold shadow-lg"
          >
            <X size={20} />
            画像を削除 (Remove)
          </button>
        </div>
      </div>
    );
  }

  if (isCameraOpen) {
    return (
      <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-agri-500 shadow-sm bg-black flex flex-col">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
          <button
            onClick={stopCamera}
            className="px-4 py-2.5 bg-black/50 backdrop-blur-md text-white rounded-lg hover:bg-black/70 transition-colors font-medium text-sm border border-white/20"
          >
            キャンセル
          </button>
          <button
            onClick={capturePhoto}
            className="flex items-center gap-2 px-6 py-2.5 bg-agri-600 text-white rounded-lg hover:bg-agri-700 transition-colors font-bold shadow-lg border border-agri-500"
          >
            <Aperture size={18} />
            撮影 (Capture)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all
        ${isDragging ? 'border-agri-500 bg-agri-50' : 'border-agri-200 hover:border-agri-400 hover:bg-agri-50/50 bg-white'}`}
    >
      {/* Standard file picker */}
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-agri-200 text-agri-800' : 'bg-agri-100 text-agri-600'}`}>
        <ImageIcon size={32} />
      </div>
      
      <p className="text-agri-800 font-bold text-center mb-4">
        画像をドラッグ＆ドロップ
      </p>
      
      <div className="flex flex-wrap justify-center gap-3 w-full">
        <button
          onClick={() => document.getElementById('file-upload')?.click()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-agri-300 rounded-lg text-agri-700 hover:bg-agri-50 hover:border-agri-400 transition-colors font-medium shadow-sm flex-1 min-w-[140px]"
        >
          <UploadCloud size={18} />
          ファイルを選択
        </button>
        <button
          onClick={startCamera}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-agri-600 text-white rounded-lg hover:bg-agri-700 transition-colors font-medium shadow-sm flex-1 min-w-[140px]"
        >
          <Camera size={18} />
          写真を撮る
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-agri-400 font-bold tracking-wide">
        <span>JPG, PNG, WEBP</span>
      </div>
    </div>
  );
};
