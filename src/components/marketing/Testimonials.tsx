export default function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Urban Greens Co-Op, Portland',
      quote: 'We went from 40 hours a week of manual labor down to about 5. The autopilot just works. I finally have time to focus on sales.',
      metric: '35 hrs/week saved',
    },
    {
      name: 'Mike Rodriguez',
      role: 'Fresh Start Farm, Austin',
      quote: 'I was skeptical about the $997 price tag, but the kit paid for itself in 6 weeks. My crop failure rate dropped from 15% to under 2%.',
      metric: '6-week payback',
    },
    {
      name: 'Emily Watts',
      role: 'Grow Room Labs, Denver',
      quote: 'The real-time alerts saved an entire batch when our AC failed at 2am. Without HarvestPilot we would have lost $800 in product.',
      metric: '$800 batch saved',
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-harvest-dark mb-4">What Farmers Are Saying</h2>
          <p className="text-xl text-gray-600">Real results from real microgreens operations.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-8 border border-gray-200 flex flex-col">
              <div className="flex-1">
                <div className="text-harvest-green text-4xl mb-4">&ldquo;</div>
                <p className="text-gray-700 leading-relaxed mb-6">{t.quote}</p>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-auto">
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-harvest-light rounded-full">
                  <span className="text-harvest-green font-semibold text-sm">{t.metric}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
