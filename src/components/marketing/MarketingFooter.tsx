import Link from 'next/link';

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-harvest-dark text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-harvest-green">🌱 HarvestPilot</h3>
            <p className="text-gray-400">Farm Intelligence Platform for specialty crop farmers.</p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:text-harvest-green transition">Twitter</a>
              <a href="#" className="hover:text-harvest-green transition">Facebook</a>
              <a href="#" className="hover:text-harvest-green transition">LinkedIn</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/#features" className="hover:text-harvest-green transition">Features</a></li>
              <li><a href="/#pricing" className="hover:text-harvest-green transition">Pricing</a></li>
              <li><a href="#" className="hover:text-harvest-green transition">Security</a></li>
              <li><a href="#" className="hover:text-harvest-green transition">Updates</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-harvest-green transition">About</a></li>
              <li><Link href="/blog" className="hover:text-harvest-green transition">Blog</Link></li>
              <li><a href="#" className="hover:text-harvest-green transition">Contact</a></li>
              <li><a href="#" className="hover:text-harvest-green transition">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-harvest-green transition">Help Center</a></li>
              <li><a href="#" className="hover:text-harvest-green transition">Documentation</a></li>
              <li><a href="#" className="hover:text-harvest-green transition">Contact Support</a></li>
              <li><a href="#" className="hover:text-harvest-green transition">API Docs</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>© {currentYear} HarvestPilot. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-harvest-green transition">Privacy Policy</a>
            <a href="#" className="hover:text-harvest-green transition">Terms of Service</a>
            <a href="#" className="hover:text-harvest-green transition">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
