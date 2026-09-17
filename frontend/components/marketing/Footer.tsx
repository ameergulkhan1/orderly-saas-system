import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  support: [
    { label: "Help Center", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/saaslogo.jpg"
                  alt="Orderly"
                  width={40}
                  height={40}
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Orderly
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm text-gray-600">
                Manage your WhatsApp/Instagram orders from one simple dashboard.
                Built for Pakistani sellers.
              </p>
              <div className="mt-6 flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="Facebook"
                >
                  {/* <Facebook className="h-5 w-5" /> */}
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-600 transition-colors"
                  aria-label="Instagram"
                >
                  {/* <Instagram className="h-5 w-5" /> */}
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  {/* <Twitter className="h-5 w-5" /> */}
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-blue-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  {/* <Linkedin className="h-5 w-5" /> */}
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-gray-900">Product</h4>
              <ul className="mt-4 space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-gray-900">Company</h4>
              <ul className="mt-4 space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-semibold text-gray-900">Support</h4>
              <ul className="mt-4 space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 border-t pt-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} Orderly. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  🇵🇰 Made in Pakistan
                </span>
                <span>•</span>
                <a
                  href="#"
                  className="hover:text-gray-900 transition-colors"
                >
                  Privacy
                </a>
                <span>•</span>
                <a
                  href="#"
                  className="hover:text-gray-900 transition-colors"
                >
                  Terms
                </a>
                <span>•</span>
                <a
                  href="#"
                  className="hover:text-gray-900 transition-colors"
                >
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}