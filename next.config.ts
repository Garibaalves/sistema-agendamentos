import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    // ❌ Ignora erros de lint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ❌ Ignora erros de type-checking durante o build
    ignoreBuildErrors: true,
  },
}

export default nextConfig
