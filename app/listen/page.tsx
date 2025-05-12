"use client";

import { useState, useRef, useEffect } from "react";

const tracks = [
  {
    title: "Anchorage",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/anchorage.mp3",
  },
  {
    title: "Baklava",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/baklava.mp3",
  },
  {
    title: "Chariot II",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/chariot-2.mp3",
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
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Explorations - Album Preview</h1>

      <ul className="mb-4 space-y-2">
        {tracks.map((track, index) => (
          <li key={track.title}>
            <button
              onClick={() => playTrack(index)}
              className={`w-full rounded p-2 text-left ${
                index === currentIndex ? "bg-gray-200" : "hover:bg-gray-100"
              }`}
            >
              {track.title}
            </button>
          </li>
        ))}
      </ul>

      <audio ref={audioRef} controls onEnded={handleEnded} className="w-full">
        <source src={tracks[currentIndex].src} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
