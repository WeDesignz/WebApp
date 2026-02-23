/**
 * Static FAQ list for the public /faq page (SEO and crawlability).
 * Keep in sync with FAQs from the API (Feedback app, location=landing_page) when possible.
 */

export interface FAQItem {
  question: string
  answer: string
}

export const faqs: FAQItem[] = [
  {
    question: 'What is WeDesignz?',
    answer:
      'WeDesignz is a premium design marketplace that connects talented designers with customers worldwide. You can browse and purchase custom designs (logos, graphics, web designs, jerseys, and more) or join as a designer to sell your work.',
  },
  {
    question: 'How do I purchase a design?',
    answer:
      'Browse designs on the marketplace, add them to your cart, and checkout. You can create an account or sign in to access your downloads and order history. Digital products are delivered instantly to your dashboard and email.',
  },
  {
    question: 'How do I become a designer on WeDesignz?',
    answer:
      'Visit our Designer Onboarding page and complete the registration steps. You will need to provide profile details, business information, and verification documents. Once approved, you can upload designs and start earning.',
  },
  {
    question: 'What are the subscription plans?',
    answer:
      'WeDesignz offers subscription plans that give you access to premium designs and benefits. Plan details and pricing are available on the homepage. You can upgrade, downgrade, or cancel according to the terms of your plan.',
  },
  {
    question: 'How do refunds work?',
    answer:
      'Refunds are available under certain conditions, such as non-delivery, payment errors, or significant difference from the product description. Digital products that have been downloaded are generally not eligible. See our Refund & Cancellation Policy for full details.',
  },
  {
    question: 'How can I contact support?',
    answer:
      'You can reach us at support@wedesignz.com, info@wedesignz.com, or by phone. Visit our Contact page for full details including address and working hours. We aim to respond within 24-48 hours on business days.',
  },
]
