'use strict';

module.exports = function(context) {
  return context[0].toUpperCase() + context.slice(1);
};
