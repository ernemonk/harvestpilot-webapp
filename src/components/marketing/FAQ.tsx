'use client';

import { useState } from 'react';

const faqData = [
  { question: 'Which crops are supported?', answer: 'HarvestPilot supports 50+ crop varieties including tomatoes, lettuce, microgreens, peppers, cucumbers, and more. Our crop library is constantly expanding, and you can request support for specific crops.' },
  { question: 'Can I integrate with my existing equipment?', answer: 'Yes! HarvestPilot works with most IoT sensors and hardware through our open API. Supported integrations include Raspberry Pi, Arduino, and common farm sensors. Our team can help with custom integrations.' },
  { question: 'How secure is my farm data?', answer: "We use enterprise-grade encryption (AES-256) for all data at rest and in transit. All data is backed up daily to geographically distributed servers. We're SOC 2 compliant and conduct regular security audits." },
  { question: 'What if I need to switch plans?', answer: 'You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing adjustments. No cancellation fees or long-term contracts required.' },
  { question: 'Do you offer customer support?', answer: 'All plans include email support. Professional and Enterprise plans include priority support and direct phone access to our farm specialists. We also offer personalized onboarding and training.' },
  { question: 'Can multiple people access the same farm?', answer: 'Yes! Invite team members with role-based permissions (Owner, Manager, Operator). Professional and Enterprise plans support unlimited team members.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-harvest-dark mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">Got questions? We have answers.</p>
        </div>
        <div className="space-y-4">
          {faqData.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
              <button className="w-full px-6 py-4 text-left font-semibold text-harvest-dark hover:bg-harvest-light transition flex justify-between items-center" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span>{item.question}</span>
                <span className="text-2xl">{openIndex === i ? '−' : '+'}</span>
              </button>
              {openIndex === i && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-gray-700">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-12 p-6 bg-harvest-light rounded-lg text-center">
          <p className="text-gray-700 mb-4">Still have questions? Our team is here to help.</p>
          <button className="px-6 py-2 bg-harvest-green text-white rounded-lg hover:bg-emerald-700 transition font-semibold">Contact Us</button>
        </div>
      </div>
    </section>
  );
}
