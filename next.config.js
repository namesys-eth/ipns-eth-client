/** @type {import('next').NextConfig} */
const env = process.env.NODE_ENV
const nextConfig = {
	distDir: "out",
	output: env === 'production' ? 'export' : 'standalone',
	reactStrictMode: true,
	basePath: "",
	assetPrefix: "",
	...(env === 'production' && {
		images: {
			loader: 'akamai',
			path: '',
		}
	})
}

module.exports = nextConfig
