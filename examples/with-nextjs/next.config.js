/** @type {import('next').NextConfig} */
const withTM = require('next-transpile-modules')(['kedao', 'draft-js']);
module.exports = withTM({
  reactStrictMode: true,
});
