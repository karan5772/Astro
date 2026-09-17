import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipProxyUrlNormalize: true,
  images: {
    // Clerk-hosted avatars, rendered through next/image on the chat page.
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
};

export default nextConfig;
