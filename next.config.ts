import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Playwright builds into .next-e2e so a test run never replaces the
  // production build that pm2 serves from .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // pt-BR (/br) was replaced by French; old links land on the Portuguese site.
  async redirects() {
    return [
      { source: "/br", destination: "/pt", permanent: true },
      { source: "/br/:path*", destination: "/pt/:path*", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
