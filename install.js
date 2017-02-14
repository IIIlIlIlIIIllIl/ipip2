// For the max compatibility, avoid using ES6 features like Promise, let or const

var http = require('http')
var fs = require('fs')
var spawn = require('child_process').spawn
var path = require('path')

var TMP = '17monipdb.zip',
  DB = '17monipdb.dat',
  URL = 'http://s.qdcdn.com/17mon/17monipdb.zip'


function download(callback) {
  http.get(URL, function(response) {
    response.pipe(fs.createWriteStream(TMP)).on('finish', function() {
        console.info('Database successfully downloaded.')
        callback()
      })
      .on('error', callback)
  }).on('error', callback)
}

function unzip(callback) {
  fs.unlink(DB, function() {
    spawn('unzip', ['-j', TMP, DB, '-d', __dirname])
      .on('error', callback)
      .on('exit', function() {
        callback()
      })
  })
}

function success() {
  console.info('Database successfully installed')
  fs.unlink(TMP, process.exit)
}


download(function(err) {
  if (err)
    return console.error('Unable to download database from ipip.net')

  unzip(function(err) {
    if (err) {
      console.error('Unable to auto unzip database. \n' + 
        'You have to manually copy the 17monipdb.dat to ' + 
        path.join(__dirname, DB));
      return;
    }
    success()
  })

})
