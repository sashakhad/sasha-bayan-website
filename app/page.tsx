import { BioSection } from "./components/BioSection";
import { ContactSection } from "./components/ContactSection";
import { IntroSection } from "./components/IntroSection";
import { MediaSection } from "./components/MediaSection";
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
