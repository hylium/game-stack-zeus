'use strict';

exports.register = function(server, options, next) {
  if (!server.methods.prometheus) {
    return next(new Error('game-stack-zeus requires gamme-stack-prometheus to be loaded first'))
  }

  var adminServer = server.select('admin');

  adminServer.route({
    method: 'GET',
    path: '/',
    config: { auth: 'simple' },
    handler: function (request, reply) {
      reply('Hello!');
    }
  });

  next();
}

exports.register.attributes = {
  name: 'zeus',
  version: '0.1.0'
}
