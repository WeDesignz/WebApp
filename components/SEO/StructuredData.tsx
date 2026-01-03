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
      email: 'wedesignz006@gmail.com',
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

