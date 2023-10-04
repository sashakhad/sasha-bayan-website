import { BioSection } from "./components/BioSection";
import { ContactSection } from "./components/ContactSection";
import { Footer } from "./components/Footer";
import { IntroSection } from "./components/IntroSection";
import { MediaSection } from "./components/MusicSection";
import { NavBar } from "./components/NavBar";

export default function Home() {
  return (
    <main className="scroll-smooth">
      <NavBar />
      <IntroSection />
      <MediaSection />
      <BioSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
