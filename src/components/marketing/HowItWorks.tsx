export default function HowItWorks() {
  const steps = [
    { number: '1', title: 'Unbox & Assemble', description: 'Snap the PVC frame together. Mount the lights and sensor pod. Connect the pump. Total time: ~60 minutes.' },
    { number: '2', title: 'Plug In & Configure', description: 'Power on the Raspberry Pi controller. Select your crop type. The system auto-calibrates watering and light schedules.' },
    { number: '3', title: 'Plant & Walk Away', description: 'Sow your trays. Autopilot handles watering, lighting, and monitoring. Get push alerts for anything unusual.' },
    { number: '4', title: 'Harvest at Peak', description: 'Get notified when your crop hits optimal harvest window. Review yield data. Start the next cycle.' },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-harvest-dark mb-4">How HarvestPilot Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Four simple steps from unboxing to autopilot.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center relative">
              <div className="w-16 h-16 bg-harvest-green text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                {step.number}
              </div>
              <h3 className="text-2xl font-bold text-harvest-dark mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
