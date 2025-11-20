import type { NextConfig } from "next";

type RemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
};

const remotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "flagcdn.com",
    pathname: "/**",
  },
];

if (process.env.WP_URL) {
  try {
    const wpHost = new URL(process.env.WP_URL).hostname;
    if (wpHost) {
      remotePatterns.push({
        protocol: "https",
        hostname: wpHost,
        pathname: "/**",
      });
    }
  } catch {
    // Ignore invalid WP_URL values to keep local dev working
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
