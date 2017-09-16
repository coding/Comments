export const LS_ACCESS_TOKEN_KEY = 'gitment-comments-token'
export const LS_USER_KEY = 'gitment-user-info'

export const NOT_INITIALIZED_ERROR = new Error('Comments Not Initialized')

const baseUrl = 'http://coding.test'

export const CODING_URL = {
    oauth: baseUrl + '/oauth_authorize.html',
    access_token: baseUrl + '/api/oauth/access_token',
    base: baseUrl,
}
