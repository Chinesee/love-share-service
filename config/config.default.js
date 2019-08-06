/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1561624248329_9612';

  config.middleware = [];

  config.security = {
    csrf: {
      enable: false, // 关闭安全威胁csrf防范
    },
  };

  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1/test',
      options: {},
    },
  };

  const userConfig = {
    myAppName: 'egg',

    bcrypt: {
      saltRounds: 10,
    },

    jwt: {
      secret: 'auth-token-secret',
      enable: true,
      ignore: [
        '/api/users/login',
        '/api/users/register',
        '/api/users/all',
        '/api/users/destroy',
      ],
    },

  };

  return {
    ...config,
    ...userConfig,
  };
};
