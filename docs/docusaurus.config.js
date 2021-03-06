// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

// const lightCodeTheme = require("prism-react-renderer/themes/github");
const lightCodeTheme = require("prism-react-renderer/themes/palenight");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Kedao",
  tagline: "Kedao is a react editor",
  url: "https://kedao.vercel.app",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "banyudu", // Usually your GitHub org/user name.
  projectName: "kedao", // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/banyudu/kedao/tree/main/docs/",
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Kedao",
        logo: {
          alt: "My Site Logo",
          src: "img/kedao.png",
        },
        items: [
          {
            type: "doc",
            docId: "intro",
            position: "left",
            label: "使用教程",
          },
          {
            href: "https://github.com/banyudu/kedao",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Copyright © ${new Date().getFullYear()} Kedao. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  plugins: [
    [
      "docusaurus-plugin-sentry",
      {
        DSN: "9eef41bc41854dfd94044d8c26b0a697",
      },
    ],
  ],
};

module.exports = config;
