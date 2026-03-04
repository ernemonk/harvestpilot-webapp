export default function Features() {
  const painPoints = [
    { icon: '😰', problem: 'Manual Watering', description: 'Hand-watering trays 5× per day. Can\'t leave for a weekend without hiring help.' },
    { icon: '🌡️', problem: 'Climate Guesswork', description: 'Temperature swings ruin entire batches. No visibility into what\'s happening overnight.' },
    { icon: '❓', problem: 'Harvest Timing', description: 'Eye-balling readiness leads to premature picks (low yield) or late picks (waste).' },
  ];

  const solutions = [
    { icon: '💧', title: 'Automatic Irrigation', description: 'Scheduled watering every 4 hours. Sensors prevent over-watering. Saves 35 hours/week.', highlight: 'Set it once, forget it' },
    { icon: '📊', title: 'Real-Time Monitoring', description: 'Temperature, humidity, soil moisture, and water level tracked continuously. Alerts sent to your phone.', highlight: 'Know what\'s happening 24/7' },
    { icon: '🎯', title: 'Harvest Readiness', description: 'AI estimates optimal harvest date (±1 day accuracy). No more guessing, no more waste.', highlight: 'Pick at peak quality' },
    { icon: '⚙️', title: 'Local-First Control', description: 'Runs without internet. All automation happens on-device. Cloud sync for convenience, not dependency.', highlight: 'Works even offline' },
  ];

  return (
    <>
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Growing microgreens shouldn&apos;t mean constant babysitting</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">You got into farming to grow food, not to be chained to manual watering schedules.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((point, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
                <div className="text-6xl mb-4">{point.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{point.problem}</h3>
                <p className="text-gray-600 leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-harvest-light/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-harvest-green/10 rounded-full mb-6">
              <span className="text-harvest-green font-semibold text-sm">What&apos;s in the Kit</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Automation that actually works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Pre-assembled hardware. Simple software. No configuration hell.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {solutions.map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-harvest-green hover:shadow-lg transition-all">
                <div className="flex items-start space-x-4">
                  <div className="text-5xl">{s.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-3">{s.description}</p>
                    <div className="inline-flex items-center px-3 py-1 bg-harvest-light rounded-full">
                      <span className="text-harvest-green font-semibold text-sm">✓ {s.highlight}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
