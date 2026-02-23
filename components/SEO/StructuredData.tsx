import Script from 'next/script'

interface OrganizationSchemaProps {
  siteUrl?: string
}

export function OrganizationSchema({ siteUrl = 'https://wedesignz.com' }: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WeDesignz',
    url: siteUrl,
    logo: `${siteUrl}/Logos/WD LOGO2048BLACK.png`,
    image: `${siteUrl}/Logos/WD LOGO2048BLACK.png`,
    description: 'Premier marketplace connecting talented designers with customers worldwide. Discover custom designs, creative solutions, and premium design services.',
    foundingDate: '2020',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-8000452183',
      contactType: 'Customer Service',
      email: 'support@wedesignz.com',
      areaServed: ['IN', 'Worldwide'],
      availableLanguage: ['en', 'hi'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'B-117, Akar Tower, B-block, Old RTO road, Yogi Tower',
      addressLocality: 'Bhilwara',
      addressRegion: 'Rajasthan',
      postalCode: '311001',
      addressCountry: 'IN',
    },
    sameAs: [
      // Add your social media links here when available
      // 'https://www.facebook.com/wedesignz',
      // 'https://www.instagram.com/wedesignz',
      // 'https://twitter.com/wedesignz',
      // 'https://www.linkedin.com/company/wedesignz',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '500',
    },
  }

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface WebsiteSchemaProps {
  siteUrl?: string
}

export function WebsiteSchema({ siteUrl = 'https://wedesignz.com' }: WebsiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WeDesignz',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface BreadcrumbSchemaProps {
  items: Array<{ name: string; url: string }>
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface FAQPageSchemaProps {
  faqs: Array<{ question: string; answer: string }>
}

export function FAQPageSchema({ faqs }: FAQPageSchemaProps) {
  if (!faqs.length) return null
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
  return (
    <Script
      id="faqpage-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export interface ProductSchemaProduct {
  name: string
  description?: string
  image?: string
  url: string
  sku?: string
  offers?: { price: number; currency: string }
}

interface ProductSchemaProps {
  product: ProductSchemaProduct
}

/**
 * Use on public design/product detail pages (e.g. /designs/[id] or /products/[id]) when those routes exist.
 */
export function ProductSchema({ product }: ProductSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: product.url,
  }
  if (product.description) schema.description = product.description
  if (product.image) schema.image = product.image
  if (product.sku) schema.sku = product.sku
  if (product.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: product.offers.price,
      priceCurrency: product.offers.currency,
    }
  }
  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface LocalBusinessSchemaProps {
  siteUrl?: string
}

export function LocalBusinessSchema({ siteUrl = 'https://wedesignz.com' }: LocalBusinessSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'WeDesignz',
    url: siteUrl,
    logo: `${siteUrl}/Logos/WD LOGO2048BLACK.png`,
    image: `${siteUrl}/Logos/WD LOGO2048BLACK.png`,
    description: 'Premier marketplace connecting talented designers with customers worldwide. Discover custom designs, creative solutions, and premium design services.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'B-117, Akar Tower, B-block, Old RTO road, Yogi Tower',
      addressLocality: 'Bhilwara',
      addressRegion: 'Rajasthan',
      postalCode: '311001',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-8000452183',
      contactType: 'Customer Service',
      email: 'support@wedesignz.com',
      areaServed: ['IN', 'Worldwide'],
      availableLanguage: ['en', 'hi'],
    },
  }
  return (
    <Script
      id="localbusiness-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export interface ArticleSchemaPost {
  headline: string
  description?: string
  url: string
  image?: string
  datePublished: string
  dateModified?: string
  author?: string
}

interface ArticleSchemaProps {
  post: ArticleSchemaPost
  siteUrl?: string
}

/**
 * Use on blog post pages (e.g. /blog/[slug]) when rendering a single article.
 */
export function ArticleSchema({ post, siteUrl = 'https://wedesignz.com' }: ArticleSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.headline,
    url: post.url,
    datePublished: post.datePublished,
    publisher: {
      '@type': 'Organization',
      name: 'WeDesignz',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/Logos/WD LOGO2048BLACK.png`,
      },
    },
  }
  if (post.description) schema.description = post.description
  if (post.image) schema.image = post.image
  if (post.dateModified) schema.dateModified = post.dateModified
  if (post.author) schema.author = { '@type': 'Person', name: post.author }
  return (
    <Script
      id="article-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

