'use strict';
/*global define:true Buffer:false */

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}


/**
   Adaptation of node-memorystream that will run in browser and server with AMD.
   Allows easy piping, pause, resume.
   Requires a browser/server compatible version of Stream
   Based on https://github.com/JSBizon/node-memorystream
*/

define(['stream', './common'], function (Stream, common) {

  /**
     Adaptation of node-memorystream that will run in browser and server with AMD.
     Allows easy piping, pause, resume.
     Requires a browser/server compatible version of Stream
     Based on https://github.com/JSBizon/node-memorystream

     @param [data] - optional data or data array to create in the stream
     @param [options] - optional object with options
     @param options.readable - default true, set false if not readable
     @param options.writable - default true, set false if not writable
     @param options.maxbufsize - null, specify max buffer size, if exceeds write will return false
     @param options.bufoveflow - null, specify overflow size, if exceeds emits `error` event Buffer overflow
     @param options.frequence - null, delay between emit `data` event in ms
     @param options.useRawData - default false, set true to not skip converting array data to Buffer
    */
  function MemoryStream(data, options) {

    Stream.call(this);
    var self = this;

    this.queue = [];

    if (data) {
      if (!Array.isArray(data)) {
        data = [data];
      }

      data.forEach(function (chunk) {
        if (common.hasBuffer()) { // can only do if we have Buffer
          if (!common.isBuffer(chunk) && !options.useRawData) {
            chunk = new Buffer(chunk);
          }
        }

        self.queue.push(chunk);
      });
    }

    this.paused = false;
    this.reachmaxbuf = false;

    options = options || {};

    this.readableVal = options.hasOwnProperty('readable') ? options.readable : true;

    this.__defineGetter__("readable", function () {
      return self.readableVal;
    });

    this.__defineSetter__("readable", function (val) {
      self.readableVal = val;
      if (val) {
        self._next();
      }
    });

    this.writable = options.hasOwnProperty('writable') ? options.writable : true;
    this.maxbufsize = options.hasOwnProperty('maxbufsize') ? options.maxbufsize : null;
    this.bufoverflow = options.hasOwnProperty('bufoveflow') ? options.bufoveflow : null;
    this.frequence = options.hasOwnProperty('frequence') ? options.frequence : null;

    common.nextTick(function () {
      self._next();
    });
  }

  MemoryStream.prototype = new Stream();
  MemoryStream.prototype.constructor = MemoryStream;

  /**
     Convenience factory method for creating a read stream,
     setting the necessary options
    */
  MemoryStream.createReadStream = function (data, options) {
    options = options || {};
    options.readable = true;
    options.writable = false;

    return new MemoryStream(data, options);
  };

  /**
     Convenience factory method for creating a write stream,
     setting the necessary options.
    */
  MemoryStream.createWriteStream = function (data, options) {
    options = options || {};
    options.readable = false;
    options.writable = true;

    return new MemoryStream(data, options);
  };


  MemoryStream.prototype._next = function () {
    var self = this;
    function next() {
      function dodo() {
        if (self.flush() && self.readable) {
          common.nextTick(next);
        }
      }
      if (self.frequence) {
        setTimeout(dodo, self.frequence);
      } else {
        dodo();
      }
    }
    if (! this.paused) {
      next();
    }
  };

  /**
     If options.readable = false, MemoryStream will accumulate data
     written to it, then you can get the result using `toString()`.

     @example
     var http = require('http'),
     MemoryStream = require('memorystream');

     var options = {
       host: 'google.com'
     };
     var memStream = new MemoryStream(null, {
       readable : false
     });

    var req = http.get(options, function(res) {
      res.pipe(memStream);
      res.on('end', function() {
        console.log(memStream.toString());
      });
    });
   */
  MemoryStream.prototype.toString = MemoryStream.prototype.getAll = function () {
    var self = this;
    var ret = '';
    this.queue.forEach(function (data) {
      if (self._decoder) {
        var string = self._decoder.write(data);
        if (string.length) {
          ret += data;
        }
      } else {
        ret += data;
      }
    });
    return ret;
  };

  /**
     Can only do the setEncoding if we have Buffer (on server),
     on browser it will never do this.
    */
  MemoryStream.prototype.setEncoding = function (encoding) {
    if (common.hasBuffer()) { // running on server?
      var StringDecoder = require('string_decoder').StringDecoder;
      this._decoder = new StringDecoder(encoding);
    }
  };


  MemoryStream.prototype.pause = function () {
    if (this.readable) {
      this.paused = true;
    }
  };

  MemoryStream.prototype.resume = function () {
    if (this.readable) {
      this.paused = false;
      this._next();
    }
  };

  MemoryStream.prototype.end = function (chunk, encoding) {
    if (typeof chunk !== 'undefined') {
      this.write(chunk, encoding);
    }
    this.writable = false;
    if (this.queue.length === 0) {
      this.readable = false;
    }
    this._emitEnd();
  };

  MemoryStream.prototype._getQueueSize = function () {
    var queuesize = 0, i = 0;
    for (i = 0; i < this.queue.length; i++) {
      queuesize += Array.isArray(this.queue[i]) ? this.queue[i][0].length : this.queue[i].length;
    }
    return queuesize;
  };


  MemoryStream.prototype._emitEnd = function () {
    if (! this._ended) {
      this._ended = true;
      this.emit('end');
    }
  };


  MemoryStream.prototype._getQueueSize = function () {
    var queuesize = 0, i = 0;
    for (i = 0; i < this.queue.length; i++) {
      queuesize += Array.isArray(this.queue[i]) ? this.queue[i][0].length : this.queue[i].length;
    }
    return queuesize;
  };


  MemoryStream.prototype.flush = function () {
    if (! this.paused && this.readable && this.queue.length > 0) {
      var data = this.queue.shift();
      var cb;

      if (Array.isArray(data)) {
        cb = data[1];
        data = data[0];
      }

      if (this._decoder) {
        var string = this._decoder.write(data);
        if (string.length) {
          this.emit('data', string);
        }
      } else {
        this.emit('data', data);
      }

      if (cb) {
        cb(null);
      }

      if (this.reachmaxbuf && this.maxbufsize >= this._getQueueSize()) {
        this.reachmaxbuf = false;
        this.emit('drain');
      }

      return true;
    }

    if (!this.writable && !this.queue.length) {
      this._emitEnd();
    }

    return false;
  };

  MemoryStream.prototype.write = function (chunk, encoding, callback) {

    if (! this.writable) {
      throw new Error('The memory stream is no longer writable.');
    }

    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }

    if (common.hasBuffer()) {
      if (! (chunk instanceof Buffer)) {
        chunk = new Buffer(chunk, encoding);
      }
    }

    var queuesize = chunk.length;
    if (this.maxbufsize || this.bufoverflow) {
      queuesize += this._getQueueSize();
      if (this.bufoveflow && queuesize > this.bufoveflow) {
        this.emit('error', "Buffer overflowed (" + this.bufoverflow + "/" + queuesize + ")");
        return;
      }
    }

    if (typeof callback === 'function') {
      this.queue.push([chunk, callback]);
    } else {
      this.queue.push(chunk);
    }

    this._next();

    if (this.maxbufsize && queuesize > this.maxbufsize) {
      this.reachmaxbuf = true;
      return false;
    }

    return true;
  };

  MemoryStream.prototype.destroy = function () {

    this.end();

    this.queue = [];

    this.readable = false;
    this.writable = false;
  };


  MemoryStream.prototype.destroySoon = function () {
    this.writable = false;

    this._destroy = true;

    if (! this.readable || this.queue.length === 0) {
      this.destroy();
    }

  };

  return MemoryStream;

});
