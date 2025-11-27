"use client";

export default function FAQSection() {
  const faqs = [
    { q: "How do I upload my designs?", a: "Create an account, go to Upload Design, and follow the steps to add files, details, and pricing." },
    { q: "What file formats are supported?", a: "We support common formats like PNG, SVG, Figma, Sketch, GLB/GLTF, and more." },
    { q: "How do payments work?", a: "Customers purchase securely; payouts are sent to your connected account per schedule." },
    { q: "Can I offer services as well?", a: "Yes, you can enable your freelancer profile and receive inquiries from teams." },
  ];

  return (
    <section id="faqs" className="py-24">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">FAQs</h2>
          <p className="text-foreground/70 mt-3">Common questions about selling designs and services.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-xl border border-border bg-card p-5">
              <summary className="cursor-pointer select-none text-base font-medium">
                {item.q}
              </summary>
              <p className="mt-3 text-sm text-foreground/80">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}



