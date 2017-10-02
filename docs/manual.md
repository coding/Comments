## 项目描述

本项目在 [gitment](https://imsun.net/posts/gitment-introduction/) 基础上修改而成。
依托 [Coding.net](https://coding.net) 的讨论功能，
使用 [OAuth 机制](http://www.ruanyifeng.com/blog/2014/05/oauth_2_0.html) 的授权方式，
利用 Coding 的账号体系和讨论的 [OpenApi](https://open.coding.net)，
实现的面向静态页面的讨论插件。

项目主要解决的问题是：现在流行的众多静态博客，国内缺少一个方便易用的评论插件。
（静态博客由于无法提供服务端数据存储，评论功能是需要第三方提供的）

## 使用主题

~~在[支持 Coding Comments 的主题中](（此处应该有一个兼容主题列表页面的 url）)选择一个你喜欢的主题。~~

在 `_config.yml` 文件中，`coding_comments` 配置类似如下
```yml
coding_comments:
  owner: 'wusisu'
  repo: 'wusisu'
  oauth: 
    client_id: '562b3b6b49cadee03464d430c9ccd7c0'
    client_secret: 'bada319fff24ae2e91f2800340cdc0dcfe85fdf7'
```

配置内容看[配置项说明](#配置项说明)。

## 配置项说明

- owner: [Coding.net](https://coding.net) 的用户名。
- repo: 你所拥有的一个**公开**项目的名字。
- oauth.{client_id & client_secret}: 你[注册的 oauth app](#注册 oauth app) 的秘钥。

### 注册 oauth app
访问[应用管理页](https://coding.net/user/account/setting/applications)，点击添加应用。
![点击添加应用](https://dn-coding-net-production-pp.qbox.me/1dee41b7-4ea0-45fe-8e7a-53d0f63cf521.png)

填写应用信息，值得注意的是，『回调地址』必须为你的访问的地址，这个是处于安全性的考虑。
![填写信息](https://dn-coding-net-production-pp.qbox.me/8b7ba489-2236-4dc8-83c6-2ae560104442.png)

创建成功后，即可获得你的 client_id 和 client_secret
![成功](https://dn-coding-net-production-pp.qbox.me/e9f37b96-eb36-4711-b46d-01bc127e408b.png)

## 开发主题 

配置内容看[配置项说明](#配置项说明)。

```yml
coding_comments:
  owner: 'wusisu'
  repo: 'wusisu'
  oauth: 
    client_id: '562b3b6b49cadee03464d430c9ccd7c0'
    client_secret: 'bada319fff24ae2e91f2800340cdc0dcfe85fdf7'
```

我用以[黄玄的博客](http://huangxuan.me/)作为例子，演示[如何增加 Coding Comments 的支持](https://github.com/wusisu/huxpro.github.io/commit/9a8afd49807d3e696569f6988a5b0a38029a10da)。

这里有个某 Coding 核心开发 [囧老师](https://coding.net/u/jiong) 花了十来分钟[在其 Demo Blog 实现的 Coding Comments](https://coding.net/u/jiong/p/jiong/git/compare/17f6676efcfd875aee530abf716f6cf48ba77c86...2a6d9f14362983f613a25b3b9bb9b97525cd3b38?tab=2)。

## 静态页面使用
配置内容看[配置项说明](#配置项说明)。

案例可以看 [Demo Page](https://coding.github.io/Comments/) 的[代码实现](https://github.com/Coding/Comments/blob/bd905ac2e6d15ae16de0c023c7ec37666ab4417f/index.html)。

script 的引用可以看最新的 [release](https://github.com/Coding/Comments/releases)。

## 开发插件

### dev
`yarn && yarn dev`

访问 http://127.0.0.1:3000/test/gitment.html

### build
`yarn build`
