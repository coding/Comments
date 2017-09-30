'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _icons = require('../icons');

var _constants = require('../constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function renderInit(_ref, instance) {
  var meta = _ref.meta,
      user = _ref.user,
      error = _ref.error;

  var container = document.createElement('div');
  container.lang = instance.lang;
  container.className = 'gitment-container gitment-init-container';

  if (error) {
    var errorBlock = document.createElement('div');
    errorBlock.className = 'gitment-init-error';

    if (error === _constants.NOT_INITIALIZED_ERROR && user.login && user.login.toLowerCase() === instance.owner.toLowerCase()) {
      var initHint = document.createElement('div');
      var initButton = document.createElement('button');
      initButton.className = 'gitment-init-btn';
      initButton.onclick = function () {
        initButton.setAttribute('disabled', true);
        instance.init().catch(function (e) {
          initButton.removeAttribute('disabled');
          alert(e);
        });
      };
      initButton.innerText = '初始化讨论';
      initHint.appendChild(initButton);
      errorBlock.appendChild(initHint);
    } else {
      errorBlock.innerText = error;
    }
    container.appendChild(errorBlock);
    return container;
  }
  return container;
}

function renderHeader(_ref2, instance) {
  var meta = _ref2.meta,
      user = _ref2.user,
      reactions = _ref2.reactions;

  var container = document.createElement('div');
  container.lang = instance.lang;
  container.className = 'gitment-container gitment-header-container';

  var commentsCount = document.createElement('span');
  commentsCount.innerHTML = '\n    ' + (meta.comments ? ' \u2022 <strong>' + meta.comments + '</strong> Comments' : '') + '\n  ';
  container.appendChild(commentsCount);

  if (meta.html_url) {
    var issueLink = document.createElement('a');
    issueLink.className = 'gitment-header-issue-link';
    issueLink.href = meta.html_url;
    issueLink.target = '_blank';
    issueLink.innerText = '管理评论';
    container.appendChild(issueLink);
  }

  return container;
}

function renderComments(_ref3, instance) {
  var meta = _ref3.meta,
      comments = _ref3.comments,
      commentReactions = _ref3.commentReactions,
      currentPage = _ref3.currentPage,
      user = _ref3.user,
      error = _ref3.error;

  var container = document.createElement('div');
  container.lang = instance.lang;
  container.className = 'gitment-container gitment-comments-container';

  if (error) {
    return container;
  }

  if (comments === undefined) {
    var loading = document.createElement('div');
    loading.innerText = '加载评论中...';
    loading.className = 'gitment-comments-loading';
    container.appendChild(loading);
    return container;
  } else if (!comments.length) {
    var emptyBlock = document.createElement('div');
    emptyBlock.className = 'gitment-comments-empty';
    emptyBlock.innerText = '还没有评论';
    container.appendChild(emptyBlock);
    return container;
  }

  var commentsList = document.createElement('ul');
  commentsList.className = 'gitment-comments-list';

  comments.forEach(function (comment) {
    _moment2.default.locale(instance.lang);
    var commentDate = (0, _moment2.default)(comment.created_at);
    var createDate = commentDate.fromNow();
    var createDateDetail = commentDate.format('L HH:mm');
    var commentItem = document.createElement('li');
    commentItem.className = 'gitment-comment';
    commentItem.innerHTML = '\n      <a class="gitment-comment-avatar" href="https://coding.net' + comment.owner.path + '" target="_blank">\n        <img class="gitment-comment-avatar-img" src="' + (comment.owner.avatar.startsWith('http') ? comment.owner.avatar : 'https://coding.net' + comment.owner.avatar) + '"/>\n      </a>\n      <div class="gitment-comment-main">\n        <div class="gitment-comment-header">\n          <a class="gitment-comment-name" href="https://coding.net' + comment.owner.path + '" target="_blank">\n            ' + comment.owner.name + '\n          </a>\n          \u8BC4\u8BBA\u4E8E\n          <span title="' + createDateDetail + '">' + createDate + '</span>\n          <div class="gitment-comment-like-btn">' + _icons.heart + ' ' + (comment.up_vote_counts || '') + '</div>\n          <div class="gitment-comment-reply-btn">' + _icons.reply + '</div>\n        </div>\n        <div class="gitment-comment-body gitment-markdown">' + comment.content + '</div>\n      </div>\n    ';
    var likeButton = commentItem.querySelector('.gitment-comment-like-btn');
    var likedReaction = comment.up_vote_users && comment.up_vote_users.find(function (likeUser) {
      return likeUser.global_key === user.global_key;
    });

    if (likedReaction) {
      likeButton.classList.add('liked');
      likeButton.onclick = function () {
        return instance.unlikeAComment(comment.id);
      };
    } else {
      likeButton.classList.remove('liked');
      likeButton.onclick = function () {
        return instance.likeAComment(comment.id);
      };
    }

    var replyButton = commentItem.querySelector('.gitment-comment-reply-btn');
    replyButton.onclick = function () {
      //Finds y value of given object
      function findPos(obj) {
        var curtop = 0;
        if (obj.offsetParent) {
          do {
            curtop += obj.offsetTop;
          } while (obj = obj.offsetParent);
          return curtop;
        }
      }
      var writeField = container.parentElement.parentElement.querySelector('.gitment-editor-write-field');
      var textarea = writeField.querySelector('textarea');
      textarea.value += '@' + comment.owner.global_key + ' ';
      window.scrollTo(0, findPos(textarea));
      textarea.focus();
    };

    // dirty
    // use a blank image to trigger height calculating when element rendered
    var imgTrigger = document.createElement('img');
    var markdownBody = commentItem.querySelector('.gitment-comment-body');
    imgTrigger.className = 'gitment-hidden';
    imgTrigger.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    imgTrigger.onload = function () {
      if (markdownBody.clientHeight > instance.maxCommentHeight) {
        markdownBody.classList.add('gitment-comment-body-folded');
        markdownBody.style.maxHeight = instance.maxCommentHeight + 'px';
        markdownBody.title = 'Click to Expand';
        markdownBody.onclick = function () {
          markdownBody.classList.remove('gitment-comment-body-folded');
          markdownBody.style.maxHeight = '';
          markdownBody.title = '';
          markdownBody.onclick = null;
        };
      }
    };
    commentItem.appendChild(imgTrigger);

    commentsList.appendChild(commentItem);
  });

  container.appendChild(commentsList);

  if (meta) {
    var pageCount = Math.ceil(meta.child_count / instance.perPage);
    if (pageCount > 1) {
      var pagination = document.createElement('ul');
      pagination.className = 'gitment-comments-pagination';

      if (currentPage > 1) {
        var previousButton = document.createElement('li');
        previousButton.className = 'gitment-comments-page-item';
        previousButton.innerText = '上一页';
        previousButton.onclick = function () {
          return instance.goto(currentPage - 1);
        };
        pagination.appendChild(previousButton);
      }

      var _loop = function _loop(i) {
        var pageItem = document.createElement('li');
        pageItem.className = 'gitment-comments-page-item';
        pageItem.innerText = i;
        pageItem.onclick = function () {
          return instance.goto(i);
        };
        if (currentPage === i) pageItem.classList.add('gitment-selected');
        pagination.appendChild(pageItem);
      };

      for (var i = 1; i <= pageCount; i++) {
        _loop(i);
      }

      if (currentPage < pageCount) {
        var nextButton = document.createElement('li');
        nextButton.className = 'gitment-comments-page-item';
        nextButton.innerText = '下一页';
        nextButton.onclick = function () {
          return instance.goto(currentPage + 1);
        };
        pagination.appendChild(nextButton);
      }

      container.appendChild(pagination);
    }
  }

  return container;
}

function renderEditor(_ref4, instance) {
  var user = _ref4.user,
      error = _ref4.error;

  var container = document.createElement('div');
  container.lang = instance.lang;
  container.className = 'gitment-container gitment-editor-container';

  var shouldDisable = user.login && !error ? '' : 'disabled';
  var disabledTip = user.login ? '' : 'Login to Comment';
  container.innerHTML = '\n      ' + (user.login ? '<a class="gitment-editor-avatar" href="https://coding.net' + user.path + '" target="_blank">\n            <img class="gitment-editor-avatar-img" src="' + user.avatar_url + '"/>\n          </a>' : user.isLoggingIn ? '<div class="gitment-editor-avatar">' + _icons.spinner + '</div>' : '<a class="gitment-editor-avatar" href="' + instance.loginLink + '" title="login with Coding.net">\n              ' + _icons.coding + '\n            </a>') + '\n    </a>\n    <div class="gitment-editor-main">\n      <div class="gitment-editor-header">\n        <nav class="gitment-editor-tabs">\n          <button class="gitment-editor-tab gitment-selected">\u7F16\u8F91</button>\n          <button class="gitment-editor-tab">\u9884\u89C8</button>\n        </nav>\n        <div class="gitment-editor-login">\n          ' + (user.login ? '<a class="gitment-editor-logout-link">退出</a>' : user.isLoggingIn ? '登录中...' : '\u4F7F\u7528 Coding.net \u8D26\u53F7 <a class="gitment-editor-login-link" href="' + instance.loginLink + '">\u767B\u5F55</a>') + '\n        </div>\n      </div>\n      <div class="gitment-editor-body">\n        <div class="gitment-editor-write-field">\n          <textarea placeholder="\u7559\u4E0B\u60A8\u7684\u8BC4\u8BBA..." title="' + disabledTip + '" ' + shouldDisable + '></textarea>\n        </div>\n        <div class="gitment-editor-preview-field gitment-hidden">\n          <div class="gitment-editor-preview gitment-markdown"></div>\n        </div>\n      </div>\n    </div>\n    <div class="gitment-editor-footer">\n      <a class="gitment-editor-footer-tip" href="https://github.com/Coding/Comments" target="_blank">\n      \u7531 Coding Comments \u9A71\u52A8\n      </a>\n      <button class="gitment-editor-submit" title="' + disabledTip + '" ' + shouldDisable + '>\u8BC4\u8BBA</button>\n    </div>\n  ';
  if (user.login) {
    container.querySelector('.gitment-editor-logout-link').onclick = function () {
      return instance.logout();
    };
  }

  var writeField = container.querySelector('.gitment-editor-write-field');
  var previewField = container.querySelector('.gitment-editor-preview-field');

  var textarea = writeField.querySelector('textarea');
  textarea.oninput = function () {
    textarea.style.height = 'auto';
    var style = window.getComputedStyle(textarea, null);
    var height = parseInt(style.height, 10);
    var clientHeight = textarea.clientHeight;
    var scrollHeight = textarea.scrollHeight;
    if (clientHeight < scrollHeight) {
      textarea.style.height = height + scrollHeight - clientHeight + 'px';
    }
  };

  var _container$querySelec = container.querySelectorAll('.gitment-editor-tab'),
      _container$querySelec2 = _slicedToArray(_container$querySelec, 2),
      writeTab = _container$querySelec2[0],
      previewTab = _container$querySelec2[1];

  writeTab.onclick = function () {
    writeTab.classList.add('gitment-selected');
    previewTab.classList.remove('gitment-selected');
    writeField.classList.remove('gitment-hidden');
    previewField.classList.add('gitment-hidden');

    textarea.focus();
  };
  previewTab.onclick = function () {
    previewTab.classList.add('gitment-selected');
    writeTab.classList.remove('gitment-selected');
    previewField.classList.remove('gitment-hidden');
    writeField.classList.add('gitment-hidden');

    var preview = previewField.querySelector('.gitment-editor-preview');
    var content = textarea.value.trim();
    if (!content) {
      preview.innerText = 'Nothing to preview';
      return;
    }

    preview.innerText = 'Loading preview...';
    instance.markdown(content).then(function (html) {
      return preview.innerHTML = html;
    });
  };

  var submitButton = container.querySelector('.gitment-editor-submit');

  var doSubmit = function doSubmit() {
    submitButton.innerText = '提交中...';
    submitButton.setAttribute('disabled', true);
    instance.post(textarea.value.trim()).then(function (data) {
      textarea.value = '';
      textarea.style.height = 'auto';
      submitButton.removeAttribute('disabled');
      submitButton.innerText = '评论';
    }).catch(function (e) {
      alert(e);
      submitButton.removeAttribute('disabled');
      submitButton.innerText = '评论';
    });
  };

  submitButton.onclick = doSubmit;

  textarea.onkeydown = function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.keyCode == 13 || e.keyCode == 10)) {
      e.preventDefault();
      doSubmit();
    }
  };

  return container;
}

function renderFooter() {
  var container = document.createElement('div');
  container.lang = instance.lang;
  container.className = 'gitment-container gitment-footer-container';
  container.innerHTML = '\n    Powered by\n    <a class="gitment-footer-project-link" href="https://github.com/Coding/Comments" target="_blank">\n      Coding Comments\n    </a>\n  ';
  return container;
}

function render(state, instance) {
  var container = document.createElement('div');
  container.lang = instance.lang;
  container.className = 'gitment-container gitment-root-container';
  container.appendChild(instance.renderInit(state, instance));
  container.appendChild(instance.renderEditor(state, instance));
  container.appendChild(instance.renderHeader(state, instance));
  container.appendChild(instance.renderComments(state, instance));
  // container.appendChild(instance.renderFooter(state, instance))
  return container;
}

exports.default = { render: render, renderInit: renderInit, renderHeader: renderHeader, renderComments: renderComments, renderEditor: renderEditor, renderFooter: renderFooter };
//# sourceMappingURL=default.js.map