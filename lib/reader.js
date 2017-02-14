'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var util = require('util');

/**
 * Reader driver
 * @param {Buffer} buffer
 */
function Reader(buffer) {
  this.buffer = buffer;
  this.len = buffer.readInt32BE(0);
}

/**
 * lookup an ip
 * @param  {Integer} ip IPv4 address in int
 * @return {Array}    lookup result
 */
Reader.prototype.lookup = function(ip) {
  var HEADER_SIZE = this.HEADER_SIZE;
  var BLOCK_SIZE = this.BLOCK_SIZE;

  var partition = (ip & this.PARTITION_MASK) >>> this.PARTITION_FACTOR;
  var floor = this.buffer.readInt32LE(partition + 4) * BLOCK_SIZE + HEADER_SIZE;
  var ceil = this.len - HEADER_SIZE - 4;

  // binary search
  var low = 0;
  var high = Math.floor((ceil - floor) / BLOCK_SIZE);
  var mid;

  while (low <= high) {
    mid = (low + high) >>> 1;
    var offset = floor + mid * BLOCK_SIZE + 4;
    var a = this.buffer.readInt32BE(offset) >>> 0;
    var b = this.buffer.readInt32BE(offset + BLOCK_SIZE) >>> 0;

    if (b < ip) {
      low = mid + 1;
    } else if (a > ip) {
      high = mid - 1;
    } else {
      // found
      offset += BLOCK_SIZE;
      var index = this.buffer.readInt32LE(offset + 4) >>> 0;
      var recordOffset = (index & this.RECORD_MASK) + this.len - HEADER_SIZE;
      var recordLength = this.buffer.readUInt8(offset + this.LEN_OFFSET);
      return this.buffer.slice(recordOffset, recordOffset + recordLength).toString().split('\t');
    }
  }

  return null;
};

function Dat() {
  Reader.apply(this, arguments);

  this.HEADER_SIZE = 0x400;
  this.PARTITION_MASK = 0xFF000000;
  this.RECORD_MASK = 0x00FFFFFF;
  this.BLOCK_SIZE = 8;
  this.PARTITION_FACTOR = 22;
  this.LEN_OFFSET = 7;
  this.columns = ['country', 'province', 'city'];
}

function Datx() {
  Reader.apply(this, arguments);

  this.HEADER_SIZE = 0x40000;
  this.PARTITION_MASK = 0xFFFF0000;
  this.RECORD_MASK = 0xFFFFFFFF;
  this.BLOCK_SIZE = 9;
  this.PARTITION_FACTOR = 14;
  this.LEN_OFFSET = 8;
  this.columns = ['country', 'province', 'city', 'organization', 
    'isp', 'latitude', 'longitude', 'timezone', 'timezone2', 'governcode'];
}

util.inherits(Dat, Reader);
util.inherits(Datx, Reader);

exports.Dat = Dat;
exports.Datx = Datx;