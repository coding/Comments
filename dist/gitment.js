'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mobx = require('mobx');

var _constants = require('./constants');

var _utils = require('./utils');

var _default = require('./theme/default');

var _default2 = _interopRequireDefault(_default);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var scope = 'project:topics,user';

function extendRenderer(instance, renderer) {
  instance[renderer] = function (container) {
    var targetContainer = (0, _utils.getTargetContainer)(container);
    var render = instance.theme[renderer] || instance.defaultTheme[renderer];

    (0, _mobx.autorun)(function () {
      var e = render(instance.state, instance);
      if (targetContainer.firstChild) {
        targetContainer.replaceChild(e, targetContainer.firstChild);
      } else {
        targetContainer.appendChild(e);
      }
    });

    return targetContainer;
  };
}

var Gitment = function () {
  _createClass(Gitment, [{
    key: 'accessToken',
    get: function get() {
      return localStorage.getItem(_constants.LS_ACCESS_TOKEN_KEY);
    },
    set: function set(token) {
      localStorage.setItem(_constants.LS_ACCESS_TOKEN_KEY, token);
    }
  }, {
    key: 'loginLink',
    get: function get() {
      var oauthUri = _constants.CODING_URL.oauth;
      var redirect_uri = this.oauth.redirect_uri || window.location.href;

      var oauthParams = Object.assign({
        scope: scope,
        redirect_uri: redirect_uri,
        response_type: 'code'
      }, this.oauth);

      return '' + oauthUri + _utils.Query.stringify(oauthParams);
    }
  }]);

  function Gitment() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Gitment);

    this.defaultTheme = _default2.default;
    this.useTheme(_default2.default);

    Object.assign(this, {
      id: window.location.href.split('?')[0],
      title: window.document.title,
      link: window.location.href,
      desc: '',
      labels: [],
      theme: _default2.default,
      oauth: {},
      perPage: 20,
      maxCommentHeight: 250,
      labelUsingHash: false,
      lang: 'zh-CN'
    }, options);

    this.useTheme(this.theme);

    var user = {};
    try {
      var userInfo = localStorage.getItem(_constants.LS_USER_KEY);
      if (this.accessToken && userInfo) {
        Object.assign(user, JSON.parse(userInfo), {
          fromCache: true
        });
      }
    } catch (e) {
      localStorage.removeItem(_constants.LS_USER_KEY);
    }

    this.state = (0, _mobx.observable)({
      user: user,
      error: null,
      meta: {},
      comments: undefined,
      reactions: [],
      commentReactions: {},
      currentPage: 1
    });

    var query = _utils.Query.parse();
    if (query.code) {
      var _oauth = this.oauth,
          client_id = _oauth.client_id,
          client_secret = _oauth.client_secret;

      var code = query.code;
      delete query.code;
      var search = _utils.Query.stringify(query);
      var replacedUrl = '' + window.location.origin + window.location.pathname + search + window.location.hash;
      history.replaceState({}, '', replacedUrl);

      Object.assign(this, {
        id: replacedUrl.split('?')[0],
        link: replacedUrl
      }, options);

      this.state.user.isLoggingIn = true;
      _utils.http.post(_constants.CODING_URL.access_token, {
        code: code,
        client_id: client_id,
        client_secret: client_secret
      }, '').then(function (data) {
        console.log(data);
        _this.accessToken = data.access_token;
        _this.update();
      }).catch(function (e) {
        _this.state.user.isLoggingIn = false;
        alert(e);
      });
    } else {
      this.update();
    }
  }

  _createClass(Gitment, [{
    key: 'init',
    value: function init() {
      var _this2 = this;

      return this.createIssue().then(function () {
        return _this2.loadComments();
      }).then(function (comments) {
        _this2.state.error = null;
        return comments;
      });
    }
  }, {
    key: 'useTheme',
    value: function useTheme() {
      var _this3 = this;

      var theme = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.theme = theme;

      var renderers = Object.keys(this.theme);
      renderers.forEach(function (renderer) {
        return extendRenderer(_this3, renderer);
      });
    }
  }, {
    key: 'update',
    value: function update() {
      var _this4 = this;

      return Promise.all([this.loadMeta(), this.loadUserInfo()]).then(function () {
        return Promise.all([_this4.loadComments()]);
      }).catch(function (e) {
        return _this4.state.error = e;
      });
    }
  }, {
    key: 'markdown',
    value: function markdown(text) {
      return _utils.http.post('https://api.github.com/markdown', {
        text: text,
        mode: 'gfm'
      });
    }
  }, {
    key: 'getIdentity',
    value: function getIdentity() {
      var id = this.id,
          labelUsingHash = this.labelUsingHash;

      var identity = id;
      if (labelUsingHash || identity.length > 200) {
        identity = (0, _md2.default)(identity);
      }
      return identity;
    }
  }, {
    key: 'createIssue',
    value: function createIssue() {
      var _this5 = this;

      var owner = this.owner,
          repo = this.repo,
          title = this.title,
          link = this.link,
          desc = this.desc,
          labels = this.labels,
          author = this.author,
          blog_theme = this.blog_theme;


      var identity = this.getIdentity();

      return _utils.http.post('/api/user/' + owner + '/project/' + repo + '/topics', {
        title: title.length > 63 ? title.substring(0, 60) + '...' : title,
        labels: labels.concat(['gitment', identity]),
        content: link + '\n\n' + desc,
        author: author,
        theme: blog_theme
      }).then(function (meta) {
        _this5.state.meta = meta;
        return meta;
      });
    }
  }, {
    key: 'getIssue',
    value: function getIssue() {
      if (this.state.meta.id) return Promise.resolve(this.state.meta);

      return this.loadMeta();
    }
  }, {
    key: 'post',
    value: function post(content) {
      var _this6 = this;

      var author = this.author,
          blog_theme = this.blog_theme;

      return this.getIssue().then(function (issue) {
        return _utils.http.post(issue.comments_url, { content: content, author: author, theme: blog_theme }, '');
      }).then(function (data) {
        _this6.state.meta.comments++;
        var pageCount = Math.ceil(_this6.state.meta.comments / _this6.perPage);
        if (_this6.state.currentPage === pageCount) {
          _this6.state.comments.push(data);
        }
        _this6.update();
        return data;
      });
    }
  }, {
    key: 'loadMeta',
    value: function loadMeta() {
      var _this7 = this;

      var owner = this.owner,
          repo = this.repo;

      return _utils.http.get('/api/user/' + owner + '/project/' + repo + '/topics', {
        creator: owner,
        labels: this.getIdentity()
      }).then(function (issues) {
        if (!issues.length) return Promise.reject(_constants.NOT_INITIALIZED_ERROR);
        _this7.state.meta = issues[0];
        return issues[0];
      });
    }
  }, {
    key: 'loadComments',
    value: function loadComments() {
      var _this8 = this;

      var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.state.currentPage;

      return this.getIssue().then(function (issue) {
        return _utils.http.get(issue.comments_url, { page: page, pageSize: _this8.perPage }, '');
      }).then(function (comments) {
        _this8.state.comments = comments.list;
        return comments;
      });
    }
  }, {
    key: 'loadUserInfo',
    value: function loadUserInfo() {
      var _this9 = this;

      if (!this.accessToken) {
        this.logout();
        return Promise.resolve({});
      }

      return _utils.http.get('/api/account/current_user').then(function (user) {
        user.login = user.global_key;
        user.avatar_url = user.avatar;
        if (user.avatar_url.startsWith('/')) {
          user.avatar_url = 'https://coding.net' + user.avatar_url;
        }
        _this9.state.user = user;
        localStorage.setItem(_constants.LS_USER_KEY, JSON.stringify(user));
        return user;
      });
    }
  }, {
    key: 'login',
    value: function login() {
      window.location.href = this.loginLink;
    }
  }, {
    key: 'logout',
    value: function logout() {
      localStorage.removeItem(_constants.LS_ACCESS_TOKEN_KEY);
      localStorage.removeItem(_constants.LS_USER_KEY);
      this.state.user = {};
    }
  }, {
    key: 'goto',
    value: function goto(page) {
      this.state.currentPage = page;
      this.state.comments = undefined;
      return this.loadComments(page);
    }
  }, {
    key: 'likeAComment',
    value: function likeAComment(commentId) {
      var _this10 = this;

      if (!this.accessToken) {
        alert('Login to Like');
        return Promise.reject();
      }

      var author = this.author,
          blog_theme = this.blog_theme;


      return _utils.http.post(this.state.meta.comments_url + '/' + commentId + '/upvote', { author: author, theme: blog_theme }).then(function () {
        return _this10.update();
      });
    }
  }, {
    key: 'unlikeAComment',
    value: function unlikeAComment(commentId) {
      var _this11 = this;

      if (!this.accessToken) return Promise.reject();

      var author = this.author,
          blog_theme = this.blog_theme;


      return _utils.http.delete(this.state.meta.comments_url + '/' + commentId + '/upvote', { author: author, theme: blog_theme }).then(function () {
        return _this11.update();
      });
    }
  }]);

  return Gitment;
}();

module.exports = Gitment;
//# sourceMappingURL=gitment.js.map