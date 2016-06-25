/**
   Starts a wifi client and connects to a mqtt broker.
   Broker sends rgb in comma separatet int values.
   Those ar splitted and than displayed as pixels.
*/

#include <ESP8266WiFi.h>

#include <PubSubClient.h>

// fast led pin order on the esp
#define FASTLED_ESP8266_RAW_PIN_ORDER
#include "FastLED.h"

// how many leds do we have ?
#define NUM_LEDS 4
CRGB leds[NUM_LEDS];

/* Set these to your desired credentials. */
const char *ssid = "suckOnMe";
const char *password = "leatomhannes";

/* mqtt server host */
const char* mqtt_server = "192.168.0.3";
const int mqtt_port = 1883;
// which topic to listen to
const char* mqtt_pixel_val_topic = "/pixels/value";
const char* mqtt_pixel_stat_topic = "/pixels/status";

/* When was the last mqtt message status send ? */
long mqtt_lastStatusSend = 0;
/* char of the status message */
char mqtt_stat_msg[50];
/*  status counter */
int mqtt_stats_counter = 0;

// mqtt client
WiFiClient espClient;
PubSubClient mqttClient(espClient);

/**
   Arduino setup method
*/
void setup() {
  FastLED.addLeds<NEOPIXEL, 0>(leds, NUM_LEDS);
  Serial.begin(115200);
  setup_wifi();
  mqtt_setup();
}

/**
   Arduino loop method
*/
void loop() {
  mqtt_loop();
}


/**
  Starts the wifi client
*/
void setup_wifi() {
  delay(1000);
  WiFi.begin(ssid, password);
  int currLed = 0;

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");

    // use the leds to show we are still connecting.
    FastLED.clear();
    leds[currLed] = CRGB::Red;
    FastLED.show();
    currLed++;
    if (currLed == NUM_LEDS) {
      currLed = 0;
    }
  }

  // some debug stuff
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // blink the leds
  for (int i = 0; i < 4; i++) {
    FastLED.clear();
    for (int j = 0; j < NUM_LEDS; j++) {
      leds[j] = CRGB::Green;
    }
    FastLED.show();
    delay(250);
    FastLED.clear();
    for (int j = 0; j < NUM_LEDS; j++) {
      leds[j] = CRGB::Black;
    }
    FastLED.show();
    delay(250);
  }


  FastLED.clear();
}

/**
   Starts the mqtt client
*/
void mqtt_setup() {
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqtt_callback);
}

/**
   Is called from the main loop
*/
void mqtt_loop() {
  if (!mqttClient.connected()) {
    mqtt_reconnect();
  }
  mqttClient.loop();

  // send status to the statús topic
  long now = millis();
  if (now - mqtt_lastStatusSend > 60000) {
    mqtt_lastStatusSend = now;
    ++mqtt_stats_counter;
    snprintf (mqtt_stat_msg, 75, "Status  #%ld", mqtt_stats_counter);
    mqttClient.publish(mqtt_pixel_stat_topic, mqtt_stat_msg);
  }
}

/**
   Reconnects the mqtt client when it lost its connection
*/
void mqtt_reconnect() {
  // Loop until we're reconnected
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (mqttClient.connect("ESP8266Client_" + ESP.getChipId())) {
      Serial.println("mqtt connected");
      mqttClient.publish(mqtt_pixel_stat_topic, "PixelsClient connected");
      mqttClient.subscribe(mqtt_pixel_val_topic);
    } else {
      Serial.print("mqtt failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}
/**
   Is called when something arrvies on the topic
*/
void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("mqtt Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  // holds the color values for rgb
  String currentColor = "";
  // current led
  int currLed = 0;

  FastLED.clear();


  for (int i = 0; i < length; i++) {
    char currChar = (char)payload[i];
    // next number to read
    if (currChar == ',') {
      // okay we reached the next color led
      long number = strtol( currentColor.c_str(), NULL, 16);

      leds[currLed++] = number;
      // stop there are no more leds
      if (currLed == NUM_LEDS) {
        break;
      }
      // dim was readed, well than read colors
      currentColor = "";
    } else {
      // read the char and concat it to a string
      currentColor += currChar;
    }
  }
  FastLED.show();
}

