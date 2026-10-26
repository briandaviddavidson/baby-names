import { BASE_PATH } from './lib/site.js';

// Static export, deployed at https://briandaviddavidson.com/names/
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
