/**
 * This script takes all the emojionres from the list and displays them randomly
 * Cause of laziness i copied most of the code from the backend
 */

// extend array
Array.prototype.randomElement = function() {
  return this[Math.floor(Math.random() * this.length)];
};


/**
 * Load configuration
 */
var config = require("./config.json");

/**
 * we need this to read the emoji's
 */
fs = require('fs');

/**
 * Libary for emoji stuff
 */
var emojione = require('emojione');

/**
 * Logging is nice
 */
var winston = require('winston');

/**
 * Libary for reading pixel data
 */
var getPixels = require("get-pixels");

/**
 * list of all emojis
 */
var emojis = [];

/**
 * Libary for resizing images
 */
var sharp = require('sharp');



/**
 * We need some mqtt stuff to send the data to the display
 */
var mqtt = require('mqtt');
var mqttClient = mqtt.connect(config.mqtt.server);
mqttClient.on('connect', function() {
  var date = new Date();
  winston.info('[MQTT] : Connected to server: ' + config.mqtt.server + ' on toppic: ' + config.mqtt.topicValue);
  mqttClient.publish(config.mqtt.topicStatus, 'PngToPixelServerConnected: ' + date);

  // collect all emojis
  for (var idx in emojione.emojioneList) {
    emojis.push(idx);
  }

  setInterval(displayEmojiRandomly, config.randomTimeoutInSec * 1000);
});

/*
 * Displays randomly an emoji
 */
var displayEmojiRandomly = function() {

  var emoji = emojis.randomElement();
  winston.info('[Random] : Displaying emoji ' + emoji);

  var filePath = config.emojionePath + readEmoji(emoji) + '.png';
  readImageData(filePath);
};

/**
 * Code token from the emjione libary
 */
var readEmoji = function(emoji) {

  imageFileName = emoji.replace(emojione.regUnicode, function(unicodeChar) {
    if ((typeof unicodeChar === 'undefined') || (unicodeChar === '') || (!(unicodeChar in emojione.jsEscapeMap))) {
      // if the unicodeChar doesnt exist just return the entire match
      return unicodeChar;
    } else {
      // get the unicode codepoint from the actual char
      unicode = emojione.jsEscapeMap[unicodeChar];
      return unicode;
    }
  });

  imageFileName = imageFileName.replace(emojione.regShortNames, function(shortname) {
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
 * Reads the data from the image and turns it into the data which is send over the mqtt bus
 */
var readImageData = function(imagePath) {

  var date = new Date();
  var resizeImg = 'output_' + date + '.png';

  sharp(imagePath)
    .resize(16, 16)
    .toFile(resizeImg, function(err) {

      if (err) {
        winston.error('[IMG] Image could not be resized' + err);
        return;
      }

      winston.info('[IMG] resized image to 16x16');
      getPixels(resizeImg, function(pixelsErr, pixels) {
        if (pixelsErr) {
          var message = 'Could not read pixel data from: ' + resizeImg;
          fs.unlinkSync(resizeImg);
          winston.error(message);
          return;
        }

        fs.unlinkSync(resizeImg);
        winston.info('[IMG] :  Readed Image to pixels');
        var data = parseImageData(pixels);

        for (var idx in data) {
          var mqttData = data[idx];
          mqttClient.publish(config.mqtt.topicValue, mqttData, function(error, granted) {

          });
        }
      });
    });
};

/**
 * Parses the data from the pixels informations
 */
var parseImageData = function(pixels) {
  var res = [];

  var dataLine = '';
  var chunkCount = 0;

  var lineStart = 256;

  var sep = ',';
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

      // we reached a new line andf is not the first one
      if (x % config.ledsPerCol === 0 && y !== 0) {
        lineStart = (y % 2 === 0) ? pos - config.ledsPerCol : pos - config.ledsPerCol;
      }

      // calculate the position in the rgb array
      var pos = (y % 2 === 0) ? lineStart - x : lineStart + x;

      dataLine += (pos - 1) + sep + rgbData + sep;
      chunkCount++;
      if (chunkCount == config.colorSizeChunk) {
        res.push(dataLine);
        dataLine = '';
        chunkCount = 0;
      }


      // there might be some more informations we just skip
      dataPos += (pixels.shape[2] - 3);
    }
  }
  winston.debug('[IMG] : data: ' + res);
  return res;
};

/**
 * Converts number to hex and adds padding
 */
function dec2hex(d) {
  return ('0' + (Number(d).toString(16))).slice(-2).toUpperCase();
}
