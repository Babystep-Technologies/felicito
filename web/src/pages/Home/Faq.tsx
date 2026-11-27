import { useEffect, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqs } from '@/config/faqs';

export default function Faq() {
  // Generate FAQ structured data for AI discovery
  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }),
    []
  );

  // Inject FAQ schema into the page head for AI crawlers
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    script.id = 'faq-schema';
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('faq-schema');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [faqSchema]);

  return (
    <section className="pt-16 pb-24 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl text-foreground">Questions, answered</h2>
      </div>

      <Accordion type="multiple" className="w-full space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="rounded-2xl border-2 border-ink bg-card shadow-pop-sm transition-shadow last:border-b-2 data-[state=open]:shadow-pop"
          >
            <AccordionTrigger className="text-left text-foreground text-base md:text-lg font-semibold px-6 py-4 hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 text-sm md:text-base text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
