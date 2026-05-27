"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Hls from "hls.js";

const VIDEO_SRC = "/api/uploads/lesson10/lesson10.m3u8";

export default function WatchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(VIDEO_SRC);
      hls.attachMedia(video);
      return () => hls.destroy();
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = VIDEO_SRC;
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <Link href="/dashboard" className="self-start text-sm text-blue-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold">Lesson 10</h1>
      <video
        ref={videoRef}
        controls
        className="w-full max-w-4xl rounded-lg bg-black"
      />
    </div>
  );
}
