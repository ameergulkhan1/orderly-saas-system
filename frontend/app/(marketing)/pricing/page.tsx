import { Navbar } from "@/components/marketing/Navbar";
import { Pricing } from "@/components/marketing/Pricing";
import { Footer } from "@/components/marketing/Footer";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="py-24">
        <div className="mx-auto max-w-7xl px-4">
          <Pricing />
        </div>
      </main>
      <Footer />
    </>
  );
}