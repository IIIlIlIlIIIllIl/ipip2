'use strict';


var fs = require('fs');
var net = require('net');
var reader = require('./reader');

var DEFAULT_DATA_PATH = require('path').join(__dirname, '..', '17monipdb.dat');

/**
 * IPIP database reader
 * @param {Object|String} opt initialize options
 */
function IPIP(opt) {
  if (typeof opt === 'string') {
    this._database = opt;
  } else {
    opt = opt || {};
    this._database = opt.data || DEFAULT_DATA_PATH;
  }

  this._version = opt.version || this._database.split('.').pop();
  if (!this._version.match(/^datx?$/i)) {
    throw new Error('Invalid database version');
  }

  var buffer = fs.readFileSync(this._database);
  var Driver = {
    datx: reader.Datx,
    dat: reader.Dat
  }[this._version];
  this._driver = new Driver(buffer);
}

/**
 * query information by ip address
 * @param  {String} ip IPv4 address
 * @return {Object|Array}    query result
 */
IPIP.prototype.ip = function(ip, format) {
  var ipInt = 0;
  if (typeof ip === 'number') {
    ipInt = ip;
  } else if (net.isIPv4(ip)) {
    ipInt = ip.split('.')
      .reverse()
      .map(function(v, i) {
        return v << (8 * i);
      })
      .reduce(function(a, b) {
        return a + b;
      }) >>> 0;
  }

  if (isNaN(ipInt) || ipInt <= 0 || ipInt > 0xFFFFFFFF) {
    throw new Error('Invalid ip address: ' + ip);
  }

  var result = this._driver.lookup(ipInt);
  return this._wrap(result, format);
};

/**
 * wrap result in given format
 * @param  {Object} result
 * @param  {String} format 
 * @return {Object|Array}
 */
IPIP.prototype._wrap = function(array, format) {
  format = format || 'dict';

  if (array === null) {
    array = this._driver.columns.map(String.prototype.valueOf, 'N/A');
  }

  if (format === this.FORMAT_ARRAY) {
    return array;
  } else if (format === this.FORMAT_DICT) {
    var dict = {};
    this._driver.columns.forEach(function(key, i) {
      dict[key] = array[i] || '';
    });
    return dict;
  } else {
    throw new Error('Invalid param');
  }
}

IPIP.prototype.FORMAT_DICT = 'dict';
IPIP.prototype.FORMAT_ARRAY = 'array';

module.exports = function(opt) {
  var instance = new IPIP(opt);
  return instance.ip.bind(instance);
}

module.exports.IPIP = IPIP;