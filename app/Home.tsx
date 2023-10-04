import { BioSection } from "./components/BioSection";
import { IntroSection } from "./components/IntroSection";
import { MediaSection } from "./components/MusicSection";
import { NavBar } from "./components/NavBar";

export default function Home() {
  return (
    <main>
      <NavBar />
      <IntroSection />
      <MediaSection />
      <BioSection />
      <ContactSection />
    </main>
  );
}
