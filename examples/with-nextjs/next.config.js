/** @type {import('next').NextConfig} */
const withTM = require('next-transpile-modules')(['kedao']);
module.exports = withTM({
  reactStrictMode: true,
});
