'use strict';

var Path = require('path'), _ = require('lodash'), Q = require('q'), fs = require('fs'), Handlebars = require('handlebars');

exports.register = function(server, options, next) {
  if (!server.methods.prometheus) {
    throw new Error('game-stack-zeus requires gamme-stack-prometheus to be loaded first');
  }

  var adminServer = server.select('admin'), defaultContext = {plugins: adminServer.methods.hyperion.getPlugins()};

  // Authentication strategy
  adminServer.auth.default('simple');

  // Registering Handlebars
  adminServer.views({
    engines: {
      'hbs': Handlebars
    },
    relativeTo: __dirname,
    path: './views',
    layoutPath: './views/layout',
    layout: true,
    helpersPath: './views/helpers',
    context: defaultContext
  });

  // Zeus dashboard route
  adminServer.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
      var compiledWidgets = defaultContext.widgets(_.reduce(defaultContext.plugins, function(obj, plugin) {
        obj[plugin.name] = !adminServer.methods[plugin.name] || !adminServer.methods[plugin.name].data ? {} : adminServer.methods[plugin.name].data();
        return obj;
      }, {}));

      reply.view('dashboard', {title: 'Dashboard', widgets: compiledWidgets});
    }
  });

  // Plugin handling
  _.reduce(defaultContext.plugins, function(promise, plugin) {
    var viewPath = require.resolve(plugin.module).replace('index.js', '') + 'lib/admin/';

    // Plugin route
    adminServer.route({
      method: 'GET',
      path: '/' + plugin.module,
      handler: function(request, reply) {
        reply.view('index', {title: plugin.name}, {path: viewPath});
      }
    });

    // Plugin widgets for the dashboard
    return promise.then(function(result) {
      return Q.Promise(function(resolve) {
        fs.readFile(viewPath + 'widget.hbs', function(err, data) {
          resolve(err ? '' : result + data.toString());
        });
      });
    });
  }, Q.Promise(function(resolve) {
    resolve('');
  })).then(function(widgets) {
    defaultContext.widgets = Handlebars.compile(widgets);
    next();
  }).catch(function(err) {
    next(err);
  });

  // Static files
  _.each([
    {filename: 'styles.css', path: 'views/css/styles.css'},
    {filename: 'jquery.js', path: '../node_modules/jquery/dist/jquery.js'},
    {filename: 'bootstrap.js', path: '../node_modules/bootstrap/dist/js/bootstrap.js'},
    {filename: 'bootstrap.css', path: '../node_modules/bootstrap/dist/css/bootstrap.css'}
  ], function(file) {
    adminServer.route({
      method: 'GET',
      path: '/' + file.filename,
      handler: {
        file: Path.join(__dirname, './' + file.path)
      }
    });
  });
};

exports.register.attributes = {
  name: 'zeus',
  version: '0.1.0'
};
