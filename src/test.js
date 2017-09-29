var Gitment = Gitment || require('./gitment')

const config = window.config

if (!config) {
  throw new Error('You need your own config to run this test.')
}

Object.assign(config, {
  author: 'i@wusisu.com',
  blog_theme: 'localhsot',
})

const gitment = new Gitment(config)

gitment.render('container')

window.gitment = gitment

try {
  window.http = require('./utils').http
} catch (e) {}
