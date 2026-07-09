import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // data/pricing.xlsx is read from disk at request time; without this, the
  // deployed serverless bundle wouldn't include it (Next only traces
  // statically-analyzable imports, not fs reads).
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
};

export default nextConfig;
