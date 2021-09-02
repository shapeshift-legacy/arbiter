// https://docs.cypress.io/guides/guides/plugins-guide.html

module.exports = (on, config) => {
  return Object.assign({}, config, {
    fixturesFolder: 'tests/functional/fixtures',
    integrationFolder: 'tests/functional/specs',
    screenshotsFolder: 'tests/functional/screenshots',
    videosFolder: 'tests/functional/videos',
    supportFile: 'tests/functional/support/index.js',
  })
}
