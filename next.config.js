const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { compare } = require('compare-versions');
const readingTime = require('reading-time');
const withPlugins = require('next-compose-plugins');
const withVideos = require('next-videos');
const withOptimizedImages = require('next-optimized-images');

const withTM = require('next-transpile-modules')(['@modulz/design-system']);

module.exports = withPlugins([withTM, withOptimizedImages, withVideos], {
  // Next.js config
  // ...

  async redirects() {
    // ...
  },

  async rewrites() {
    const DATA_PATH = path.join(__dirname, 'data');

    function getLatestVersionFromPath(fromPath) {
      const paths = glob.sync(`${DATA_PATH}/${fromPath}/**/*.mdx`);
      const components = {};

      paths.forEach((p) => {
        const [name, version] = p
          .replace(DATA_PATH, '')
          .replace(`/${fromPath}/`, '')
          .replace('.mdx', '')
          .split('/');

        components[name] = [...(components[name] || [version]), version];
      });

      const latest = Object.entries(components).reduce((acc, curr) => {
        const [name, versions] = curr;
        const [latestVersion] = versions.sort((a, b) => compare(a, b)).reverse();
        acc[name] = latestVersion;
        return acc;
      }, {});

      return latest;
    }

    function createRewrites(latestVersionMap, url) {
      return [...Object.entries(latestVersionMap)].reduce((redirects, curr) => {
        const [name, version] = curr;
        redirects.push({ source: `${url}${name}`, destination: `${url}${name}/${version}` });
        return redirects;
      }, []);
    }

    return [
      ...createRewrites(
        getLatestVersionFromPath('primitives/components'),
        '/docs/primitives/components/'
      ),
      ...createRewrites(
        getLatestVersionFromPath('primitives/utilities'),
        '/docs/primitives/utilities/'
      ),
      ...createRewrites(
        getLatestVersionFromPath('design-system/components'),
        '/design-docs/system/components/'
      ),
    ];
  },
});
