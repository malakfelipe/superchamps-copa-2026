import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Escudos de times via CDN do API-Sports
      { protocol: "https", hostname: "media.api-sports.io" },
      // Bandeiras de países
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
  async redirects() {
    return [
      // www servia 200 com canonical pro apex — Google indexava como "página
      // alternativa". 301 consolida sinais e poupa crawl budget no domínio único.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.superchamps.com.br" }],
        destination: "https://superchamps.com.br/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
