"use client";
import { useState } from "react";

type Video = {
  id: string | null;
  title: string;
};

const soloPerformances: Video[] = [
  { id: "3PO-0O33MmE", title: "First Light" },
  { id: "9RJLTiVjCaY", title: "Between Notes" },
  { id: "kGqCS62Zqvc", title: "Long Shadow" },
  { id: "sQle8Lqyj1A", title: "Soft Circuit" },
  { id: "N7IgSDDpZTc", title: "Crosscurrent" },
  { id: "VNqu0SZTX1I", title: "After the Pulse" },
];

const existingVideos = [
  { id: "2_9VJpwKGZ4", title: "The Naming — High Tide" },
  { id: "lTLSTv-XCuk", title: "Beats Sketch 1" },
  { id: "QsuwC9MBVTg", title: "Sktch002 — Ruh y Alma" },
  { id: "XwyrG8QX5tA", title: "Morning Improv" },
  { id: "TgZ9Eq2G4dM", title: "Sitar Sounds at The Center SF — Highlights" },
  { id: "ycoErhyEqbQ", title: "The Naming" },
];

function VideoPlayer({ id, title }: { id: string; title: string }) {
  return (
    <iframe
      className="aspect-video w-full rounded-lg border-0"
      src={`https://www.youtube.com/embed/${id}`}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

function VideoCard({ id, title }: { id: string; title: string }) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <VideoPlayer id={id} title={title} />
      <figcaption className="text-sm font-medium">{title}</figcaption>
    </figure>
  );
}

export function SitarPerformanceReel() {
  return (
    <section
      aria-labelledby="sitar-performance-reel-heading"
      className="w-full bg-white px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10"
    >
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <h2
          id="sitar-performance-reel-heading"
          className="text-center text-2xl font-semibold"
        >
          Sitar Performance Reel
        </h2>
        <video
          aria-labelledby="sitar-performance-reel-heading"
          className="aspect-video w-full rounded-lg bg-black"
          controls
          playsInline
          preload="metadata"
          poster="/epk/sitar/sitar-performance-reel.webp"
        >
          <source
            src="/epk/sitar/sitar-performance-reel.mp4"
            type="video/mp4"
          />
          Your browser does not support embedded video.
        </video>
      </div>
    </section>
  );
}

export function VideoSectionEPK() {
  const [showAll, setShowAll] = useState(false);
  const availableSolos = soloPerformances.filter(
    (video): video is { id: string; title: string } => video.id !== null,
  );
  const visibleVideos = showAll ? existingVideos : existingVideos.slice(0, 3);

  return (
    <section
      aria-label="Watch"
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7 px-4 sm:px-6"
    >
      <h2 className="text-2xl font-semibold">Watch</h2>

      {availableSolos.length > 0 && (
        <div className="w-full space-y-3">
          <h3 className="text-lg font-semibold">Solo Sitar Performances</h3>
          <div className="grid gap-4 min-[880px]:grid-cols-2">
            {availableSolos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </div>
      )}

      <div className="w-full space-y-3">
        {availableSolos.length > 0 && (
          <h3 className="text-lg font-semibold">More Performances</h3>
        )}
        <div
          id="sitar-other-performances"
          className="grid gap-4 min-[880px]:grid-cols-2"
        >
          {visibleVideos.map((video) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
        <button
          type="button"
          aria-expanded={showAll}
          aria-controls="sitar-other-performances"
          onClick={() => setShowAll((prev) => !prev)}
          className="text-sm text-blue-700 hover:underline focus-visible:underline"
        >
          {showAll ? "Show fewer videos" : "Show all videos"}
        </button>
      </div>
    </section>
  );
}
