import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Links | Sasha Bayan",
  description: "Music from Sasha Bayan",
};

type MusicLink = {
  title: string;
  href: string;
  description: string;
};

const links: MusicLink[] = [
  {
    title: "Montreux",
    description: "From Enough, a singer-songwriter album.",
    href: "https://open.spotify.com/track/5d44f8CfonDtMgNTPRuie4?si=7974131c7f1a42e9",
  },
  {
    title: "Bula!",
    description: "From High Tide, a sitar world fusion band.",
    href: "https://www.musicbyhightide.com/epk/bula/listen",
  },
  {
    title: "Aurelia",
    description: "A sitar and double bass duo.",
    href: "https://www.aureliaproject.com/listen/chariot-ii",
  },
  {
    title: "Music for Vegans",
    description: "EDM that's 100% organic and non-GMO.",
    href: "https://music-for-vegans.vercel.app/listen/mus1c-for-v3gans/honeywheredidyougo/bubu/b",
  },
];

export default function LinksPage() {
  return (
    <main className="flex min-h-screen w-full max-w-md flex-col bg-primary px-6 py-16 text-dark">
      <Link href="/" className="text-sm font-thin uppercase tracking-widest">
        Sasha Bayan
      </Link>
      <h1 className="mt-10 font-glosa-display text-5xl">Links</h1>
      <ul className="mt-12 flex flex-col">
        {links.map(renderLink)}
      </ul>
    </main>
  );
}

function renderLink(link: MusicLink) {
  return <MusicLinkRow key={link.href} link={link} />;
}

function MusicLinkRow({ link }: { link: MusicLink }) {
  return (
    <li className="border-t border-dark/20 last:border-b">
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col gap-1 py-5 transition-opacity hover:opacity-60"
      >
        <span className="font-glosa-display text-2xl">{link.title}</span>
        <span className="text-sm font-light">{link.description}</span>
      </a>
    </li>
  );
}
