import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import VisualProofSection from "@/components/VisualProofSection";
import PricingSection from "@/components/PricingSection";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <VisualProofSection />
      <PricingSection />
    </main>
  );
}