"use client";
import { useState } from "react";

type Video = {
  id: string | null;
  title: string;
};

const reel: Video = {
  id: null,
  title: "Sasha Bayan — Sitar Performance Reel",
};

const soloPerformances: Video[] = [
  { id: "3PO-0O33MmE", title: "Solo Sitar 1" },
  { id: "9RJLTiVjCaY", title: "Solo Sitar 2" },
  { id: "kGqCS62Zqvc", title: "Solo Sitar 3" },
  { id: "sQle8Lqyj1A", title: "Sitar with Beats 1" },
  { id: "N7IgSDDpZTc", title: "Sitar with Beats 2" },
  { id: "VNqu0SZTX1I", title: "Sitar with Beats 3" },
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

      {reel.id && (
        <div className="w-full space-y-2">
          <h3 className="text-lg font-semibold">Performance Reel</h3>
          <VideoPlayer id={reel.id} title={reel.title} />
        </div>
      )}

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
        {(reel.id || availableSolos.length > 0) && (
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
