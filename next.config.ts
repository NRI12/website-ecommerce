import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vendors currently submit arbitrary image URLs (no upload pipeline yet),
    // so we allow any HTTPS host. Restrict this to your S3/CloudFront domain
    // once product image uploads go through the S3 pipeline (see infra/).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
