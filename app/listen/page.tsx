"use client";

import { useState, useRef, useEffect } from "react";

const tracks = [
  {
    title: "Chariot 2",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/chariot-2.mp3",
  },
  {
    title: "Jojo",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/Jojo.mp3",
  },
  {
    title: "Mether",
    src: "https://sasha-sam-tracks.s3.us-east-1.amazonaws.com/mether.mp3",
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
    title: "Xerxces",
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
