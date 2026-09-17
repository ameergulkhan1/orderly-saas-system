import { Building2, ShoppingBag, Truck } from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "Connect your business",
    description: "Sign up and set up your business profile. Add your products, prices, and stock.",
    step: "01"
  },
  {
    icon: ShoppingBag,
    title: "Manage orders, customers and inventory",
    description: "Create orders from WhatsApp/Instagram messages. Track every customer and keep inventory updated automatically.",
    step: "02"
  },
  {
    icon: Truck,
    title: "Track deliveries and revenue",
    description: "Update order statuses. Track deliveries. See your revenue and business performance at a glance.",
    step: "03"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-purple-100 px-4 py-1.5 text-sm font-medium text-purple-700">
            🚀 How It Works
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Get started in 3 simple steps
          </h2>
          <p className="text-lg text-gray-600">
            From setup to managing orders - everything you need to run your business
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-[4.5rem] top-16 hidden h-0.5 w-[calc(100%-9rem)] bg-gradient-to-r from-blue-200 to-purple-200 md:block"></div>
              )}
              
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg shadow-blue-100">
                    <step.icon className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-bold text-white shadow-lg shadow-blue-200">
                    {step.step}
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 max-w-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}