const target = 'https://gitlab-ci-dashboard.larscom.nl'

module.exports = {
  '/api/*': {
    target,
    secure: false,
    logLevel: 'debug',
    changeOrigin: true
  }
}
