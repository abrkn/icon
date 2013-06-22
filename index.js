var request = require('request')
, Canvas = require('canvas')
, Image = Canvas.Image
, fs = require('fs')

exports.readImage = function(fn, cb) {
    fs.readFile(fn, function(err, data) {
        if (err) return cb(err)
        var img = new Image()
        img.src = data
        cb(null, img, data)
    })
}

exports.writeImage = function(img, fn, w, h, cb) {
    var canvas = new Canvas(w, h)
    , ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)

    var out = fs.createWriteStream(fn)
    , stream = canvas.createPNGStream()
    stream.on('data', out.write.bind(out))
    stream.on('end', cb)
}

exports.files = [
    { 'filename': 'touch-icon-iphone.png', size: 57 },
    { 'filename': 'touch-icon-iphone-retina.png', size: 114 },
    { 'filename': 'touch-icon-ipad-retina.png', size: 144 },
    { 'filename': 'tileicon.png', size: 144 },
    { 'filename': 'favicon.png', size: 96 }
]

exports.bufferToIco = function(data, cb) {
    var mp = [{
        'Content-Disposition': 'form-data; name="imgfile"; filename="favicon.png"',
        'Content-Type': 'image/png',
        body: data
    }, {
        'Content-Disposition': 'form-data; name="remoteimgfile"',
        body: 'http://'
    }, {
        'Content-Disposition': 'form-data; name="selected"',
        body: 'file'
    }]

    request({
        url: 'http://convertico.com/appleJax.php',
        method: 'POST',
        multipart: mp,
        headers: {
            'content-type': 'multipart/form-data'
        }
    }, function(err, res, body) {
        if (err) return cb(new Error(err.message))
        if (res.statusCode !== 200) return cb(new Error(res.statusCode + ': ' + body))

        try {
            body = JSON.parse(body)
        } catch(e) {
            return cb(new Error(body))
        }

        if (body.error.length) return cb(new Error(body.error[0]))

        request('http://convertico.com' + body.New, cb)
        .pipe(fs.createWriteStream('favicon.ico'))
    })
}
