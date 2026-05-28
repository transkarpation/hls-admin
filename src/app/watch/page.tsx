"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import "videojs-hotkeys";

type Cue = { start: number; end: number; text: string };

function parseVtt(text: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const arrowLine = lines.findIndex((l) => l.includes("-->"));
    if (arrowLine === -1) continue;
    const [rawStart, rawEnd] = lines[arrowLine].split("-->").map((s) => s.trim());
    const toSeconds = (ts: string) => {
      const parts = ts.replace(",", ".").split(":").map(Number);
      return parts.length === 3
        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
        : parts[0] * 60 + parts[1];
    };
    const textLines = lines.slice(arrowLine + 1).join("\n").trim();
    if (textLines) cues.push({ start: toSeconds(rawStart), end: toSeconds(rawEnd), text: textLines });
  }
  return cues;
}

export default function WatchPage() {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const cueRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [cues, setCues] = useState<Cue[]>([]);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const activeCueIndex = cues.findLastIndex((c) => currentTime >= c.start && currentTime < c.end);

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

        if (video.subtitlesPath) {
          const vttUrl = `/api/uploads/${video.subtitlesPath.replace("uploads/", "")}`;
          fetch(vttUrl)
            .then((r) => r.text())
            .then((text) => setCues(parseVtt(text)))
            .catch(() => {});
        }

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

        player.on("timeupdate", () => setCurrentTime(player.currentTime() ?? 0));

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

  // Scroll active cue into view
  useEffect(() => {
    if (activeCueIndex >= 0) {
      cueRefs.current[activeCueIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeCueIndex]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 p-4">
      <div className="w-full max-w-7xl">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold">{title || "Watch"}</h1>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="flex w-full max-w-7xl gap-4">
          {/* Player */}
          <div className={showSubtitles && cues.length > 0 ? "w-2/3" : "w-full"}>
            <div ref={videoRef} className="w-full" />
            {cues.length > 0 && (
              <button
                onClick={() => setShowSubtitles((v) => !v)}
                className="mt-2 rounded bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700"
              >
                {showSubtitles ? "Hide Subtitles" : "Show Subtitles"}
              </button>
            )}
          </div>

          {/* Subtitle panel */}
          {showSubtitles && cues.length > 0 && (
            <div className="flex w-1/3 flex-col rounded border border-gray-200 bg-gray-50">
              <div className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600">
                Subtitles
              </div>
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: "500px" }}>
                {cues.map((cue, i) => (
                  <div
                    key={i}
                    ref={(el) => { cueRefs.current[i] = el; }}
                    onClick={() => playerRef.current?.currentTime(cue.start)}
                    className={`cursor-pointer border-b border-gray-100 px-3 py-2 text-sm transition-colors ${
                      i === activeCueIndex
                        ? "bg-blue-100 font-medium text-blue-900"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mb-0.5 block text-xs text-gray-400">
                      {new Date(cue.start * 1000).toISOString().slice(11, 19)}
                    </span>
                    {cue.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
