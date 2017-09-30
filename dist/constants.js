'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var LS_ACCESS_TOKEN_KEY = exports.LS_ACCESS_TOKEN_KEY = 'gitment-comments-token';
var LS_USER_KEY = exports.LS_USER_KEY = 'gitment-user-info';

var NOT_INITIALIZED_ERROR = exports.NOT_INITIALIZED_ERROR = new Error('等待主人初始化讨论');

var baseUrl = 'https://coding.net';
// const baseUrl = 'http://coding.test'

var CODING_URL = exports.CODING_URL = {
    oauth: baseUrl + '/oauth_authorize.html',
    access_token: baseUrl + '/api/oauth/access_token',
    base: baseUrl
};
//# sourceMappingURL=constants.js.map