/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://anting-app-0001.web.app',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  outDir: 'public',
  // ...other options
};
