"use client";
import { Header } from "../sections/Header";
import { CopyableSection } from "./CopyableSection";
import { LONG_BIO, SHORT_BIO, TAGLINE } from "./data";
import { Section } from "./Section";
import { GallerySection } from "./GallerySection";
import { FollowSection } from "./FollowSection";
import { BookSection } from "./BookSection";
import { Footer } from "@/app/components/Footer";
import { SitarPerformanceReel, VideoSectionEPK } from "./VideoSection";
import { AudioSection } from "./AudioSection";

export default function SitarEPKPage() {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-start scroll-smooth">
      <Header
        header={"Sasha Bayan"}
        subheader={
          "Classically trained sitarist blending tradition with contemporary artistry"
        }
      />
      <SitarPerformanceReel />
      <Section
        leftContent={<GallerySection />}
        rightContent={
          <div className="flex flex-col items-center justify-center gap-5 px-10">
            <h2 className="text-2xl font-semibold">About</h2>
            <CopyableSection title="Tagline" content={TAGLINE} />
            <CopyableSection title="Short Bio" content={SHORT_BIO} />
            <CopyableSection title="Long Bio" content={LONG_BIO} />
          </div>
        }
      />
      <Section
        reverse
        leftContent={<VideoSectionEPK />}
        rightContent={<AudioSection />}
      />
      <Section leftContent={<FollowSection />} rightContent={<BookSection />} />

      <Footer />
    </main>
  );
}
