import type { NextConfig } from "next";
import { codeInspectorPlugin } from "code-inspector-plugin";

const emptyPolyfill = "./src/lib/empty-polyfill.ts";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "driver.js",
      "@base-ui/react",
      "react-phone-number-input",
      "react-resizable-panels",
    ],
  },
  turbopack: {
    resolveAlias: {
      "../build/polyfills/polyfill-module": emptyPolyfill,
      "next/dist/build/polyfills/polyfill-module": emptyPolyfill,
    },
    // Click-to-source in local dev (opens Cursor). Hotkey: Alt+Shift
    rules: codeInspectorPlugin({
      bundler: "turbopack",
      editor: "cursor",
    }),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.plugins.push(
        codeInspectorPlugin({ bundler: "webpack", editor: "cursor" }),
      );
    }
    return config;
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
