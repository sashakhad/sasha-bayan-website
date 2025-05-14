"use client";

import { useState, useRef, useEffect } from "react";

const day1 = [
  {
    title: "Anchorage",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/anchorage.mp3",
  },
  {
    title: "Baklava",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/baklava.mp3",
  },
  {
    title: "Delilah",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/delilah.mp3",
  },
  {
    title: "Eugene",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/eugene.mp3",
  },
  {
    title: "Firuz",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/firuz.mp3",
  },
  {
    title: "Green Tea",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/green-tea.mp3",
  },
  {
    title: "Hex",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/hex.mp3",
  },
  {
    title: "Ion",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/ion.mp3",
  },
  {
    title: "Jojo",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/jojo.mp3",
  },
  {
    title: "Kelvin",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/kelvin.mp3",
  },
  {
    title: "Lisan",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/lisan.mp3",
  },
  {
    title: "Mether",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/mether.mp3",
  },
  {
    title: "Nile",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/nile.mp3",
  },
];

const day2 = [
  {
    title: "Chariot II",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/chariot-2.mp3",
  },
  {
    title: "Oja",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/oja.mp3",
  },
  {
    title: "Public Garden",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/public-garden.mp3",
  },
  {
    title: "Quarry",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/quarry.mp3",
  },
  {
    title: "Returning",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/returning.mp3",
  },
  {
    title: "Snausage",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/snausage.mp3",
  },
  {
    title: "Talisman",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/talisman.mp3",
  },
  {
    title: "Umbrella",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/umbrella.mp3",
  },
  {
    title: "Vinnie",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/vinnie.mp3",
  },
  {
    title: "Watermelon",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/watermelon.mp3",
  },
  {
    title: "Xerxes",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/xerxces.mp3",
  },
  {
    title: "Yarn",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/yarn.mp3",
  },
  {
    title: "Zinnia",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/zinnia.mp3",
  },
];

const day3 = [
  {
    title: "apples-anonymous",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/apples-an.mp3",
  },
  {
    title: "bubbles",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/bubbles.mp3",
  },
  {
    title: "catcopy",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/catcopy.mp3",
  },
  {
    title: "doubledip",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/doubledip.mp3",
  },
  {
    title: "elegy",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/elegy.mp3",
  },
  {
    title: "fairfax",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/fairfax.mp3",
  },
  {
    title: "hellohello",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/hellohello.mp3",
  },
  {
    title: "idiom",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/idiom.mp3",
  },
  {
    title: "KITKAT",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/KITKAT.mp3",
  },
  {
    title: "Jiujitsu",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/Jiujitsu.mp3",
  },
  {
    title: "gogo",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/gogo.mp3",
  },
  {
    title: "liloo-1",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/liloo-1.mp3",
  },
  {
    title: "liloo-2",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/liloo-2.mp3",
  },
  {
    title: "Cassieopa-lilo 3",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/Cassieopa-lilo%203.mp3",
  },
  {
    title: "lilo-4",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/lilo-4.mp3",
  },
];

const days = [
  { label: "Day 1", tracks: day1 },
  { label: "Day 2", tracks: day2 },
  { label: "Day 3", tracks: day3 },
];

const flatTracks = [...day1, ...day2, ...day3];

export default function MixesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    audio.play().catch(() => {});
  }, [currentIndex]);

  const handleEnded = () => {
    if (currentIndex < flatTracks.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="mx-auto my-10 max-w-6xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Explorations – Album Preview</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {days.map(({ label, tracks }, dayIdx) => {
          const baseIndex =
            dayIdx === 0
              ? 0
              : dayIdx === 1
              ? day1.length
              : day1.length + day2.length;

          return (
            <div key={label}>
              <h2 className="mb-2 text-lg font-semibold">{label}</h2>
              <ul className="space-y-2">
                {tracks.map((track, i) => {
                  const index = baseIndex + i;
                  return (
                    <li key={track.title}>
                      <button
                        onClick={() => playTrack(index)}
                        className={`w-full rounded p-2 text-left ${
                          index === currentIndex
                            ? "bg-gray-200 font-semibold"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {track.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <audio
        ref={audioRef}
        controls
        onEnded={handleEnded}
        className="sticky bottom-0 mt-4 w-full bg-white shadow-md"
      >
        <source src={flatTracks[currentIndex].src} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
