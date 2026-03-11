import type { Metadata } from "next";
import "./globals.css";
import SafeHydrate from "@/components/SafeHydrate";
import React from "react"; // Required for React.ReactNode type

export const metadata: Metadata = {
  title: "Velox API | High-Performance API Testing Tool",
  description:
    "Fast, lightweight, and offline-first API testing suite. Import Swagger, test endpoints, and manage your development workflow with Velox.",
  keywords: [
    "API Testing",
    "REST Client",
    "Swagger Import",
    "Developer Tools",
    "HTTP Client",
  ],
  metadataBase: new URL("https://velox-api.yourdomain.com"),
  authors: [{ name: "Subhodeep Baroi" }],
  openGraph: {
    title: "Velox API REST Client",
    description: "The lightweight alternative for API testing.",
    url: "https://velox-api.yourdomain.com",
    siteName: "Velox API",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velox API Client",
    description: "Fast, offline-first API testing suite.",
    creator: "@baroi_ai",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Velox API",
              operatingSystem: "Web",
              applicationCategory: "DeveloperApplication",
              offers: { "@type": "Offer", price: "0" },
            }),
          }}
        />
      </head>
      {/* Apply SafeHydrate here to suppress Next.js "Connection Closed" 
          errors inside the Chrome Extension environment 
      */}
      <body className="bg-[#0f172a]">
        <SafeHydrate>{children}</SafeHydrate>
      </body>
    </html>
  );
}
