export default function CTA() {
  return (
    <section className="py-20 bg-harvest-green">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Grow Smarter?</h2>
        <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">Join 1,000+ specialty crop farmers who are using HarvestPilot to increase profitability and reduce the time spent on farm management.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button className="px-8 py-4 bg-white text-harvest-green rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg">Start Your Free Trial</button>
          <button className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-emerald-600 transition font-semibold">Schedule a Demo</button>
        </div>
        <p className="text-emerald-50">✨ 7-day free trial. No credit card. Start growing smarter today.</p>
      </div>
    </section>
  );
}
