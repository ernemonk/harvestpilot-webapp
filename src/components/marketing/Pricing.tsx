export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Simple, honest pricing</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">One kit, one price. No subscriptions, no hidden fees.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-harvest-green to-emerald-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-12 text-white">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-2">HarvestPilot Starter Kit</h3>
                <p className="text-emerald-100 text-lg">Everything you need to automate one 2-tier rack</p>
              </div>
              <div className="text-center mb-10">
                <div className="flex items-end justify-center">
                  <span className="text-6xl font-bold">$997</span>
                  <span className="text-emerald-100 text-xl ml-2 mb-2">one-time</span>
                </div>
                <p className="text-emerald-100 mt-2">+ $20/month for cloud sync (optional)</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
                <h4 className="font-semibold text-lg mb-4">What&apos;s Included:</h4>
                <ul className="space-y-3">
                  {[
                    'Pre-assembled rack frame (2-tier, 8 trays)',
                    'Full-spectrum LED grow lights (pre-wired)',
                    'Automated irrigation manifold + pump',
                    'Sensor pod (temp, humidity, soil, water level)',
                    'Raspberry Pi controller (pre-configured)',
                    '5-gallon water reservoir',
                    'All cables, mounts, and connectors',
                    '60-minute setup guide + video',
                    'Lifetime software updates',
                    '6-month spare parts kit (FREE)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-6 h-6 text-emerald-200 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button className="w-full bg-white text-harvest-green py-4 rounded-lg font-bold text-lg hover:bg-emerald-50 transition-colors shadow-lg">
                Pre-Order Now → Ships March 2026
              </button>
            </div>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="mt-16 max-w-4xl mx-auto bg-gray-50 rounded-xl p-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Return on Investment</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-harvest-green mb-2">35 hrs</div>
              <div className="text-gray-600">Saved per week</div>
              <div className="text-sm text-gray-500 mt-2">40 hrs → 5 hrs/week labor</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-harvest-green mb-2">$1,750</div>
              <div className="text-gray-600">Monthly labor savings</div>
              <div className="text-sm text-gray-500 mt-2">35 hrs × $50/hr opportunity cost</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-harvest-green mb-2">1.5 mo</div>
              <div className="text-gray-600">Payback period</div>
              <div className="text-sm text-gray-500 mt-2">800% ROI in year one</div>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-8 text-sm">* Based on average microgreens operation growing 64 trays in rotation</p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Questions about setup, scaling, or commercial use?</p>
          <a href="#faq" className="text-harvest-green font-semibold hover:underline text-lg">See Frequently Asked Questions →</a>
        </div>
      </div>
    </section>
  );
}
