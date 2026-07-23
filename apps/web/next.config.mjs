/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El paquete compartido se distribuye como TypeScript: Next lo transpila.
  transpilePackages: ["@clickviajes/shared"],
  // Orígenes permitidos para peticiones a /_next/* durante `next dev`
  // (acceso desde la IP pública de esta máquina, no solo localhost).
  allowedDevOrigins: ["181.123.61.216"],
};

export default nextConfig;
