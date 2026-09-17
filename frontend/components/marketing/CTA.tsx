import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

export function CTA() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
          🎯 Start Free Today
        </div>
        
        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          Ready to stop managing orders
          <span className="block">from scattered WhatsApp chats?</span>
        </h2>
        
        <p className="mb-8 text-lg text-blue-100">
          Join 200+ sellers who already use Orderly to manage their business.
          Start your free trial today.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 hover:shadow-xl transition-all duration-300 group">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Learn More
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-white" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-white" />
            14-day free trial
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-white" />
            Cancel anytime
          </div>
        </div>
      </div>
    </section>
  );
}