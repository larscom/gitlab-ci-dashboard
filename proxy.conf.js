const target = 'https://gitlab-ci-dashboard-at.cisvm.intranet.rws.nl'

module.exports = {
  '/api/**': {
    target,
    secure: false,
    logLevel: 'debug',
    changeOrigin: true
  }
}
