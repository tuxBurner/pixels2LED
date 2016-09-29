/**
 * This tiny application reads the data from a post file and turns them into pixels rgb values.
 * Those are send over the mqtt bus.
 */


/**
 * Load configuration
 */
var config = require("./config.json")

/**
 * Logging is nice
 */
var winston = require('winston');

/**
 * we need this to read the emoji's
 */
fs = require('fs');


/**
 * We need some mqtt stuff to send the data to the display
 */
var mqtt = require('mqtt');
var mqttClient = mqtt.connect(config.mqtt.server);
mqttClient.on('connect', function() {
  var date = new Date();
  winston.info('[MQTT] : Connected to server: ' + config.mqtt.server + ' on toppic: ' + config.mqtt.topicValue);
  mqttClient.publish(config.mqtt.topicStatus, 'PngToPixelServerConnected: ' + date);
});

/**
 * Libary for reading pixel data
 */
var getPixels = require("get-pixels")

/**
 * Libary for emoji stuff
 */
var emojione = require('emojione');


/**
 * Libary for resizing images
 */
var sharp = require('sharp');

// where the emoji's are stored at
var emojiRootPath = 'node_modules/emojione/assets/png/';

/**
 * Webserver stuff goes here
 */
var express = require('express');
var app = express();

var multer = require('multer')
var upload = multer({
  dest: 'uploads/'
})

/**
 * this is called when the user uploads an image to the display.
 */
app.post('/image', upload.single('imageData'), function(req, res, next) {

  // check if we have the token in the header
  if (checkToken(req, res) == false) {
    return;
  }

  winston.info('[WEB] : Uploaded file found:', req.file);
  readImageData(req.file.path, res, true);

});

/**
 * Display an emoji on the display
 */
app.get('/emoji/:value', function(req, res) {
  // check if we have the token in the header
  if (checkToken(req, res) == false) {
    return;
  }
  var emoji = req.params.value;

  // check if it is defined
  if (emoji === undefined) {
    sendError(res, 'No emoji given', 500);
    return;
  }

  var imageName = readEmoji(emoji);
  if (imageName === emoji || imageName === undefined) {
    sendError(res, 'Could not find emoji for: ' + emoji, 500);
    return;
  }
  winston.info('[WEB] : Found emoji:(' + imageName + ')  for emoji: ' + emoji);

  var filePath = emojiRootPath + imageName;
  readImageData(filePath, res, false);
});

/**
 * Setting the brightness
 */
app.get('/brightness/:value', function(req, res) {
  // check if we have the token in the header
  if (checkToken(req, res) == false) {
    return;
  }
  var brightness = req.params.value;

  // check if it is defined
  if (brightness === undefined) {
    sendError(res, 'No brighntess given', 500);
    return;
  }

  // check if it is a number
  if (isNaN(brightness) == true) {
    sendError(res, 'Brightness is not a number: ' + brightness, 500);
    return;
  }

  // check if it is in the rane
  var brighntessNr = Number(brightness);
  if (brighntessNr > 255 || brighntessNr < 0) {
    sendError(res, 'Brightness ' + brightness + ' is not in range 0..255', 500);
    return;
  }

  mqttClient.publish(config.mqtt.topicBrightness, brightness, function(error, granted) {
    res.send('Send brightness: ' + brightness + ' to mqtt !');
  });

});

app.listen(config.webServerPort, function() {
  winston.info('[WEB] : Webapp listening on port ' + config.webServerPort + '!');
});

/**
 * Code token from the emjione libary
 */
var readEmoji = function(emoji) {
  var imageFileName = emoji.replace(emojione.regShortNames, function(shortname) {
    if ((typeof shortname === 'undefined') || (shortname === '') || (!(shortname in emojione.emojioneList))) {
      // if the shortname doesnt exist just return the entire match
      return shortname;
    } else {
      var unicode = emojione.emojioneList[shortname].unicode[emojione.emojioneList[shortname].unicode.length - 1];
      return unicode;
    }
  });
  // replace ascii smileys !
  imageFileName = imageFileName.replace(emojione.regAscii, function(entire, m1, m2, m3) {
    if ((typeof m3 === 'undefined') || (m3 === '') || (!(emojione.unescapeHTML(m3) in emojione.asciiList))) {
      // if the shortname doesnt exist just return the entire match
      return entire;
    }

    m3 = emojione.unescapeHTML(m3);
    unicode = emojione.asciiList[m3];

    return unicode;
  });

  return imageFileName;
};

/**
 * Checks if the given token is correct
 */
var checkToken = function(req, res) {
  // check if we have the token in the header
  winston.info('[WEB] : Checking if sended token matches configured token');
  if (req.headers.authorization === undefined) {
    sendError(res, message, 401);
    return false;
  }

  // check if the token is correct
  if (req.headers.authorization !== config.token) {
    var message = 'The sended token: ' + req.headers.authorization + ' does not equals: ' + config.token;
    sendError(res, message, 401);
    return false;
  }

  return true;
}

/**
 * Sends an error to the client
 */
var sendError = function(res, message, status) {
  winston.error('[WEB] : ' + message);
  res.status(status).send(message);
}

/**
 * Reads the data from the image and turns it into the data which is send over the mqtt bus
 */
var readImageData = function(imagePath, res, unlink) {

  // we need a png at the end or getpixels will die :)
  var newImgPath = imagePath + '.png';
  if (unlink === true) {
    fs.renameSync(imagePath, newImgPath);
  }

  var date = new Date();
  var resizeImg = 'output_' + date + '.png';

  sharp(newImgPath)
    .resize(16, 16)
    .toFile(resizeImg, function(err) {

      if (err) {
        sendError(res, 'Image could not be resized', 500);
        return;
      }

      winston.info('[IMG] resized image to 16x16');
      getPixels(resizeImg, function(pixelsErr, pixels) {
        if (pixelsErr) {
          var message = 'Could not read pixel data from: ' + resizeImg;
          fs.unlinkSync(resizeImg);
          if (unlink === true) {
            fs.unlinkSync(newImgPath);
          }
          sendError(res, message, 500);
          return
        }

        fs.unlinkSync(resizeImg);
        if (unlink === true) {
          fs.unlinkSync(newImgPath);
        }
        winston.info('[IMG] :  Readed Image to pixels')

        var data = parseImageData(pixels);

        sendDataOverMqttBus(data, res);
      })
    });


};

/**
 * Sends the data over mqtt bus and aknowledges it to the caller
 */
var sendDataOverMqttBus = function(data, res) {
  mqttClient.publish(config.mqtt.topicValue, data, function(error, granted) {
    res.send('Send message to mqtt !');
  });
};

/**
 * Parses the data from the pixels informations
 */
var parseImageData = function(pixels) {
  var res = '';
  var sep = '';
  var dataPos = 0;
  for (y = 0; y < pixels.shape[1]; y++) {
    for (x = 0; x < pixels.shape[0]; x++) {
      // read the rgb information
      var rgbData = '';
      for (i = 0; i < 3; i++) {
        // convert it to hex
        rgbData += dec2hex(pixels.data[dataPos]);
        dataPos++;
      }

      res += sep + rgbData;
      sep = ',';

      // there might be some more informations we just skip
      dataPos += (pixels.shape[2] - 3);
    }
  }
  winston.debug('[IMG] : data: ' + res);
  return res;
}

/**
 * Converts number to hex and adds padding
 */
function dec2hex(d) {
  return ('0' + (Number(d).toString(16))).slice(-2).toUpperCase();
}
