/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El paquete compartido se distribuye como TypeScript: Next lo transpila.
  transpilePackages: ["@clickviajes/shared"],
};

export default nextConfig;
