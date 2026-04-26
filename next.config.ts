import type { NextConfig } from "next";
import { withChroma } from "chromadb";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withChroma(nextConfig);
