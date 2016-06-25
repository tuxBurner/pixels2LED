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
* We need some mqtt stuff to send the data to the display
*/
var mqtt = require('mqtt');
var mqttClient = mqtt.connect(config.mqtt.server);
mqttClient.on('connect', function () {
  var date = new Date();
  //mqttClient.subscribe(config.mqtt.toppic);
  winston.info('[MQTT] : Connected to server: '+config.mqtt.server+' on toppic: '+config.mqtt.topic);
  mqttClient.publish(config.mqtt.topic, 'PngToPixelServerConnected: '+date);
});

/**
* Libary for reading pixel data
*/
var getPixels = require("get-pixels")

/**
* Webserver stuff goes here
*/
var express = require('express');
var app = express();

var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var fs = require('fs');

app.post('/', upload.single('imageData'), function (req, res, next) {

  // check if we have the token in the header
  winston.info('[WEB] : Checking if sended token matches configured token');
  if(req.headers.authorization === undefined) {
    var message =  'No token was send as header.';
    winston.error('[WEB] : '+message);
    res.status(401).send(message);
    return;
  }

  // check if the token is correct
  if(req.headers.authorization !== config.token) {
    var message = 'The sended token: '+req.headers.authorization+' does not equals: '+config.token;
    winston.error('[WEB] : '+message);
    res.status(401).send('Token is not correct.');
    return;
  }

  winston.info('[WEB] : Uploaded file found:',req.file);

  readImageData(req.file.path,res);

});

app.listen(config.webServerPort, function () {
  winston.info('[WEB] : Webapp listening on port '+config.webServerPort+'!');
});

/**
* Reads the daata from the image and turns it into the data which is send over the mqtt bus
*/
var readImageData = function(imagePath, res) {

  // we need a png at the end or getpixels will die :)
  var newImgPath = imagePath+'.png';
  fs.renameSync(imagePath,newImgPath);

  getPixels(newImgPath, function(err, pixels) {
    if(err) {
      var message = 'Could not read pixel data from: '+newImgPath;
      fs.unlinkSync(newImgPath);
      winston.error('[IMG] : '+message,err)
      res.status(500).send(message);
      return
    }

    fs.unlinkSync(newImgPath);
    winston.info('[IMG] :  Readed Image to pixels')

    var data = parseImageData(pixels);

    sendDataOverMqttBus(data,res);
  })
};

/**
* Sends the data over mqtt bus and aknowledges it to the caller
*/
var sendDataOverMqttBus = function(data,res) {
  mqttClient.publish(config.mqtt.topic, data,function(error,granted) {
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
  for(y=0; y < pixels.shape[1]; y++) {
    for(x=0; x < pixels.shape[0]; x++) {
      // read the rgb information
      var rgbData = '';
      for(i=0; i < 3; i++) {
        // convert it to hex
        rgbData+=dec2hex(pixels.data[dataPos]);
        dataPos++;
      }

      res+=sep+rgbData;
      sep = ',';

      // there might be some more informations we just skip
      dataPos+=(pixels.shape[2]-3);
    }
  }
  winston.debug('[IMG] : data: '+res);
  return res;
}

/**
* Converts number to hex and adds padding
*/
function dec2hex(d) {
    return  ('0'+(Number(d).toString(16))).slice(-2).toUpperCase();
}
