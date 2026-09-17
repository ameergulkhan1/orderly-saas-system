import { Navbar } from "@/components/marketing/Navbar";
import { Features } from "@/components/marketing/Features";
import { Footer } from "@/components/marketing/Footer";

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900">
              Powerful Features for Your Business
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to manage your WhatsApp and Instagram orders
            </p>
          </div>
          <Features />
        </div>
      </main>
      <Footer />
    </>
  );
}