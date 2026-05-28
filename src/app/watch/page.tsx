"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import "videojs-hotkeys";

export default function WatchPage() {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
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

        if (!videoRef.current) return;

        const videoElement = document.createElement("video-js");
        videoElement.classList.add("vjs-big-play-centered");
        videoRef.current.appendChild(videoElement);

        const tracks = video.subtitlesPath
          ? [
              {
                kind: "subtitles" as const,
                src: `/api/uploads/${video.subtitlesPath.replace("uploads/", "")}`,
                srclang: "en",
                label: "English",
                default: true,
              },
            ]
          : [];

        const player = videojs(videoElement, {
          controls: true,
          autoplay: false,
          preload: "auto",
          fluid: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          sources: [{ src, type: "application/x-mpegURL" }],
          tracks,
          plugins: {
            hotkeys: {
              seekStep: 5,
              volumeStep: 0.1,
              enableModifiersForNumbers: false,
            },
          },
        });

        playerRef.current = player;
      })
      .catch((err) => setError(err.message));

    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
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
        <div ref={videoRef} className="w-full max-w-4xl" />
      )}
    </div>
  );
}
