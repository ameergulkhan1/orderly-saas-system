import { XCircle, AlertCircle, Search, PackageX, BarChart3 } from "lucide-react";

const problems = [
  {
    icon: XCircle,
    title: "Orders lost in chats",
    description: "WhatsApp conversations are not a database. Orders get buried in endless messages."
  },
  {
    icon: Search,
    title: "Customer information scattered",
    description: "Names, phones, addresses - all over different chats with no central view."
  },
  {
    icon: AlertCircle,
    title: "Difficult to track COD",
    description: "Can't remember who paid, who didn't, and how much is pending."
  },
  {
    icon: PackageX,
    title: "No proper inventory",
    description: "You don't know what's in stock until someone asks about it."
  },
  {
    icon: BarChart3,
    title: "Can't see business performance",
    description: "No reports, no analytics, no visibility into what's actually working."
  }
];

export function Problem() {
  return (
    <section id="problems" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-red-100 px-4 py-1.5 text-sm font-medium text-red-700">
            ⚠️ The Problem
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Running your business from WhatsApp?
          </h2>
          <p className="text-lg text-gray-600">
            If you're managing orders through chats, you're losing time and money.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                <problem.icon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{problem.title}</h3>
              <p className="text-sm text-gray-600">{problem.description}</p>
            </div>
          ))}
        </div>

        {/* Solution Callout */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 shadow-sm">
            <span className="text-sm font-semibold text-blue-600">💡 Solution:</span>
            <span className="text-sm text-gray-700">Bring everything into one place with Orderly</span>
          </div>
        </div>
      </div>
    </section>
  );
}