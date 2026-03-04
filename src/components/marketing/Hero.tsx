export default function Hero() {
  return (
    <section className="pt-24 pb-32 bg-gradient-to-b from-white to-harvest-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center px-4 py-2 bg-harvest-light rounded-full mb-6">
              <span className="text-harvest-green font-semibold text-sm">Hardware-First Automation</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6">
              Your microgreens,<br />
              <span className="text-harvest-green">on autopilot</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-8 max-w-xl">
              Automate the daily growing work. Get alerted when crops are ready.
              <span className="block mt-2 font-semibold text-gray-900">Plug in and walk away.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button className="group px-8 py-4 bg-harvest-green text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center">
                Pre-Order Kit — $997
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <a href="#how-it-works" className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-harvest-green hover:text-harvest-green transition-all font-semibold text-lg text-center">
                See How It Works
              </a>
            </div>
            <div className="flex items-center space-x-8 text-sm text-gray-600">
              {['Ships fully assembled', '60-minute setup', 'No cloud required'].map((text) => (
                <div key={text} className="flex items-center">
                  <svg className="w-5 h-5 text-harvest-green mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-900">System Online</span>
                </div>
                <span className="text-xs text-gray-500">Rack A · Autopilot ON</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-orange-900 mb-2">Temperature</div>
                  <div className="text-3xl font-bold text-orange-700">72°F</div>
                  <div className="mt-2 w-full bg-orange-200 h-1.5 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-orange-600 rounded-full" /></div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-blue-900 mb-2">Humidity</div>
                  <div className="text-3xl font-bold text-blue-700">65%</div>
                  <div className="mt-2 w-full bg-blue-200 h-1.5 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-blue-600 rounded-full" /></div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">🌱 Broccoli Microgreens</span>
                  <span className="text-xs text-gray-500">Day 8 of 12</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"><div className="w-2/3 h-full bg-harvest-green rounded-full" /></div>
                <div className="mt-2 text-xs text-gray-600">✓ Next irrigation: 2h 15m · Est. harvest: Jan 30 (4 days)</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Manual Control</button>
                <button className="px-4 py-2 bg-harvest-green text-white rounded-lg text-sm font-medium hover:bg-emerald-700">View Details</button>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-xl p-4 border border-green-200 max-w-xs">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Irrigation Complete</p>
                  <p className="text-xs text-gray-600 mt-0.5">30s at 70% · 2 min ago</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-8 -right-8 w-64 h-64 bg-harvest-green opacity-5 rounded-full blur-3xl -z-10" />
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500 mb-6">Trusted by microgreens farmers in 12 states</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            {['FARM A', 'URBAN GREENS', 'GROW CO', 'FRESH START'].map((name) => (
              <span key={name} className="text-2xl font-bold text-gray-400">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
