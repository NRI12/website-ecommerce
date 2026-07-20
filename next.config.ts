import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vendors currently submit arbitrary image URLs (no upload pipeline yet),
    // so we allow any HTTPS host. Restrict this to your S3/CloudFront domain
    // once product image uploads go through the S3 pipeline (see infra/).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Most product images are already pre-sized by their source CDN (e.g.
    // Tiki serves cache/w1200/... URLs). Re-encoding them again through
    // Next's built-in optimizer means every image round-trips through this
    // single Fargate task with no CDN in front of it (CloudFront is blocked
    // pending AWS account verification), so a "cold" image pays both the
    // optimizer's fetch-and-resize cost AND loses any benefit from the
    // source CDN's own caching. Serving the source URL directly is faster
    // here. Revisit once CloudFront is available and images are proxied
    // through it, at which point re-enabling optimization is worthwhile.
    unoptimized: true,
  },
};

export default nextConfig;
