import Hero from '@/components/marketing/Hero';
import Features from '@/components/marketing/Features';
import HowItWorks from '@/components/marketing/HowItWorks';
import Testimonials from '@/components/marketing/Testimonials';
import Pricing from '@/components/marketing/Pricing';
import BlogPreview from '@/components/marketing/BlogPreview';
import FAQ from '@/components/marketing/FAQ';
import CTA from '@/components/marketing/CTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <BlogPreview />
      <FAQ />
      <CTA />
    </>
  );
}
