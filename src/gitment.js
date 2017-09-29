import { autorun, observable } from 'mobx'

import {
  LS_ACCESS_TOKEN_KEY,
  LS_USER_KEY,
  NOT_INITIALIZED_ERROR,
  CODING_URL,
} from './constants'
import { getTargetContainer, http, Query } from './utils'
import defaultTheme from './theme/default'

import md5 from 'md5'

const scope = 'project:topics,user'

function extendRenderer(instance, renderer) {
  instance[renderer] = (container) => {
    const targetContainer = getTargetContainer(container)
    const render = instance.theme[renderer] || instance.defaultTheme[renderer]

    autorun(() => {
      const e = render(instance.state, instance)
      if (targetContainer.firstChild) {
        targetContainer.replaceChild(e, targetContainer.firstChild)
      } else {
        targetContainer.appendChild(e)
      }
    })

    return targetContainer
  }
}

class Gitment {
  get accessToken() {
    return localStorage.getItem(LS_ACCESS_TOKEN_KEY)
  }
  set accessToken(token) {
    localStorage.setItem(LS_ACCESS_TOKEN_KEY, token)
  }

  get loginLink() {
    const oauthUri = CODING_URL.oauth
    const redirect_uri = this.oauth.redirect_uri || window.location.href

    const oauthParams = Object.assign({
      scope,
      redirect_uri,
      response_type: 'code',
    }, this.oauth)

    return `${oauthUri}${Query.stringify(oauthParams)}`
  }

  constructor(options = {}) {
    this.defaultTheme = defaultTheme
    this.useTheme(defaultTheme)

    Object.assign(this, {
      id: window.location.href.split('?')[0],
      title: window.document.title,
      link: window.location.href,
      desc: '',
      labels: [],
      theme: defaultTheme,
      oauth: {},
      perPage: 20,
      maxCommentHeight: 250,
      labelUsingHash: false,
      lang: 'zh-CN',
    }, options)

    this.useTheme(this.theme)

    const user = {}
    try {
      const userInfo = localStorage.getItem(LS_USER_KEY)
      if (this.accessToken && userInfo) {
        Object.assign(user, JSON.parse(userInfo), {
          fromCache: true,
        })
      }
    } catch (e) {
      localStorage.removeItem(LS_USER_KEY)
    }

    this.state = observable({
      user,
      error: null,
      meta: {},
      comments: undefined,
      reactions: [],
      commentReactions: {},
      currentPage: 1,
    })

    const query = Query.parse()
    if (query.code) {
      const { client_id, client_secret } = this.oauth
      const code = query.code
      delete query.code
      const search = Query.stringify(query)
      const replacedUrl = `${window.location.origin}${window.location.pathname}${search}${window.location.hash}`
      history.replaceState({}, '', replacedUrl)

      Object.assign(this, {
        id: replacedUrl.split('?')[0],
        link: replacedUrl,
      }, options)

      this.state.user.isLoggingIn = true
      http.post(CODING_URL.access_token, {
          code,
          client_id,
          client_secret,
        }, '')
        .then(data => {
          console.log(data)
          this.accessToken = data.access_token
          this.update()
        })
        .catch(e => {
          this.state.user.isLoggingIn = false
          alert(e)
        })
    } else {
      this.update()
    }
  }

  init() {
    return this.createIssue()
      .then(() => this.loadComments())
      .then(comments => {
        this.state.error = null
        return comments
      })
  }

  useTheme(theme = {}) {
    this.theme = theme

    const renderers = Object.keys(this.theme)
    renderers.forEach(renderer => extendRenderer(this, renderer))
  }

  update() {
    return Promise.all([this.loadMeta(), this.loadUserInfo()])
      .then(() => Promise.all([
        this.loadComments()
      ]))
      .catch(e => this.state.error = e)
  }

  markdown(text) {
    return http.post('https://api.github.com/markdown', {
      text,
      mode: 'gfm',
    })
  }

  getIdentity() {
    const { id, labelUsingHash } = this
    let identity = id;
    if (labelUsingHash || identity.length > 200) {
      identity = md5(identity)
    }
    return identity
  }

  createIssue() {
    const { owner, repo, title, link, desc, labels, author, blog_theme } = this

    const identity = this.getIdentity()
    

    return http.post(`/api/user/${owner}/project/${repo}/topics`, {
      title: title.length > 63 ? title.substring(0, 60) + '...' : title,
      labels: labels.concat(['gitment', identity]),
      content: `${link}\n\n${desc}`,
      author,
      theme: blog_theme,
    })
      .then((meta) => {
        this.state.meta = meta
        return meta
      })
  }

  getIssue() {
    if (this.state.meta.id) return Promise.resolve(this.state.meta)

    return this.loadMeta()
  }

  post(content) {
    const { author, blog_theme } = this
    return this.getIssue()
      .then(issue => http.post(issue.comments_url, { content, author, theme: blog_theme }, ''))
      .then(data => {
        this.state.meta.comments++
        const pageCount = Math.ceil(this.state.meta.comments / this.perPage)
        if (this.state.currentPage === pageCount) {
          this.state.comments.push(data)
        }
        this.update()
        return data
      })
  }

  loadMeta() {
    const { owner, repo } = this
    return http.get(`/api/user/${owner}/project/${repo}/topics`, {
        creator: owner,
        labels: this.getIdentity(),
      })
      .then(issues => {
        if (!issues.length) return Promise.reject(NOT_INITIALIZED_ERROR)
        this.state.meta = issues[0]
        return issues[0]
      })
  }

  loadComments(page = this.state.currentPage) {
    return this.getIssue()
      .then(issue => http.get(issue.comments_url, { page, pageSize: this.perPage }, ''))
      .then((comments) => {
        this.state.comments = comments.list
        return comments
      })
  }

  loadUserInfo() {
    if (!this.accessToken) {
      this.logout()
      return Promise.resolve({})
    }

    return http.get('/api/account/current_user')
      .then((user) => {
        user.login = user.global_key
        user.avatar_url = user.avatar
        if (user.avatar_url.startsWith('/')) {
          user.avatar_url = 'https://coding.net' + user.avatar_url;
        }
        this.state.user = user
        localStorage.setItem(LS_USER_KEY, JSON.stringify(user))
        return user
      })
  }

  login() {
    window.location.href = this.loginLink
  }

  logout() {
    localStorage.removeItem(LS_ACCESS_TOKEN_KEY)
    localStorage.removeItem(LS_USER_KEY)
    this.state.user = {}
  }

  goto(page) {
    this.state.currentPage = page
    this.state.comments = undefined
    return this.loadComments(page)
  }

  likeAComment(commentId) {
    if (!this.accessToken) {
      alert('Login to Like')
      return Promise.reject()
    }

    const { author, blog_theme } = this;

    return http.post(`${this.state.meta.comments_url}/${commentId}/upvote`, { author, theme: blog_theme })
      .then(() => {
        return this.update()

      })
  }

  unlikeAComment(commentId) {
    if (!this.accessToken) return Promise.reject()

    const { author, blog_theme } = this;

    return http.delete(`${this.state.meta.comments_url}/${commentId}/upvote`, { author, theme: blog_theme })
      .then(() => {
        return this.update()
      })
  }
}

module.exports = Gitment
