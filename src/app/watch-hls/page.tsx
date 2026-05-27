"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Hls from "hls.js";

export default function WatchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No video ID provided");
      return;
    }

    fetch(`/api/videos/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Video not found");
        return r.json();
      })
      .then((video) => {
        setTitle(video.title);

        if (video.status !== "ready" || !video.hlsPath) {
          setError(`Video is not ready (status: ${video.status})`);
          return;
        }

        const src = `/api/uploads/${video.hlsPath.replace("uploads/", "")}`;
        const el = videoRef.current;
        if (!el) return;

        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(el);
          return () => hls.destroy();
        }

        if (el.canPlayType("application/vnd.apple.mpegurl")) {
          el.src = src;
        }
      })
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <Link href="/dashboard" className="self-start text-sm text-blue-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold">{title || "Watch"}</h1>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <video
          ref={videoRef}
          controls
          className="w-full max-w-4xl rounded-lg bg-black"
        />
      )}
    </div>
  );
}
