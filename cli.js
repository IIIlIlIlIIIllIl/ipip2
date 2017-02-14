#!/usr/bin/env node

var fs = require('fs');
var net = require('net');
var ip = require('ipip')();

var log = function(result) {
  for (var key in result)
    console.log(key + ': ' + (result[key] || 'N/A'));
}

if (process.argv.length < 3) {
  console.error('Usage: cli.js [ip1] [ip2] ...');
  process.exit(-1);
}

process.argv.slice(2).forEach(function(e) {
  if (net.isIPv4(e)) {
    console.log('Information for ' + e + ':');
    log(ip(e));
    console.log('');
  } else {
    console.error('Invalid ip: ' + e);
  }
});