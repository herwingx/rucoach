import Script from "next/script";

export function PersonSchema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Rodrigo Urbina",
    "url": "https://rucoach.app",
    "image": "https://rucoach.app/android-chrome-512x512.png",
    "sameAs": [
      // Añadir aquí links a Instagram/TikTok si los tienes
      "https://www.instagram.com/rurbina_coach/", 
    ],
    "jobTitle": "Entrenador Personal y Coach de Fitness",
    "worksFor": {
      "@type": "Organization",
      "name": "RU Coach",
    },
    "description": "Coach especialista en hipertrofia, fuerza y transformación física con enfoque científico.",
  };

  return (
    <Script
      id="person-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationSchema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "RU Coach",
    "image": "https://rucoach.app/android-chrome-512x512.png",
    "@id": "https://rucoach.app",
    "url": "https://rucoach.app",
    "telephone": "", // Añadir si aplica
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ciudad de México", // O la ciudad que aplique
      "addressCountry": "MX",
    },
    "priceRange": "$$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "06:00",
      "closes": "22:00"
    }
  };

  return (
    <Script
      id="org-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
