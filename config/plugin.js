'use strict'

module.exports = {
  // static: {
  //   enable: true,
  // }
  cors: {
    enable: true,
    package: 'egg-cors',
  },

  // 参数校验
  validate: {
    enable: true,
    package: 'egg-validate',
  },

  // mongo数据库
  mongoose: {
    enable: true,
    package: 'egg-mongoose',
  },

  // 密码加密
  bcrypt: {
    enable: true,
    package: 'egg-bcrypt',
  },

  // JSON Web Token
  jwt: {
    enable: true,
    package: 'egg-jwt',
  },

  // 七牛云
  fullQiniu: {
    enable: true,
    package: 'egg-full-qiniu',
  },

  // WebSocket
  io: {
    enable: true,
    package: 'egg-socket.io',
  },
}
