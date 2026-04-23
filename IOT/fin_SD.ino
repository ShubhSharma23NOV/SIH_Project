#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <math.h>
#include <ArduinoJson.h>
#include <SD.h>

// ================== WiFi CONFIG ==================
const char* ssid     = "OPPO";
const char* password = "ir123456";

// ================== BACKEND CONFIG ==================
String apiURL = "https://5c7b3538eb97.ngrok-free.app/api/sensor-data";

// ================== SD CARD ==================
#define SD_CS 5

// ================== DEVICE INFO ==================
const char* DEVICE_ID   = "Shillong_CORE_401";
const float LOCATION_LAT = 25.6109;
const float LOCATION_LON = 91.9033;

// ================== ADS1115 ==================
Adafruit_ADS1115 ads;

#define ADS_MV     0.1875f
#define SAMPLES    25

// Channels
#define PH_CH      0
#define TURB_CH    1
#define TDS_CH     2

// ================== pH CALIBRATION ==================
const float PH_SLOPE  = 6.356155f;
const float PH_OFFSET = -8.899745f;
const float PH_DIVIDER_MULT = 1.5f;

// ================== TURBIDITY CALIBRATION (OLD) ==================
float TURBID_CLEAN_V = 1.8468f;
float TURBID_DIRTY_V = 0.4479f;
float NTU_MAX = 1000.0f;

float turbFiltered = 0.0f;

// ================== TDS CALIBRATION ==================
const float TDS_K = 0.82f;

// ================== Fake dynamic temperature (UPDATED) ==================
float getFakeTemperature() {

  float minTemp = 15.0;     // lowest boundary
  float maxTemp = 19.0;     // highest boundary

  float amplitude = (maxTemp - minTemp) / 2.0;  
  float midPoint  = (maxTemp + minTemp) / 2.0;

  // Slower change → 25 seconds cycle
  float temp = midPoint + amplitude * sin(millis() / 25000.0);

  return temp;
}

// =======================================================
// ADS Stable Read
// =======================================================
float readADS_settled(uint8_t ch) {
  ads.readADC_SingleEnded(ch);
  delay(8);

  long sum = 0;
  for (int i = 0; i < SAMPLES; i++) {
    sum += ads.readADC_SingleEnded(ch);
    delay(3);
  }
  return (float)sum / SAMPLES;
}

float countsToVolt(float counts) {
  return (counts * ADS_MV) / 1000.0;
}

// =======================================================
// pH SENSOR
// =======================================================
float readPH(float &outV) {
  float v = countsToVolt(readADS_settled(PH_CH)) * PH_DIVIDER_MULT;

  float pH = PH_SLOPE * v + PH_OFFSET;
  if (pH < 0) pH = 0;
  if (pH > 14) pH = 14;

  outV = v;
  return pH;
}

// =======================================================
// TURBIDITY SENSOR (OLD CALIBRATION + Adaptive Filter)
// =======================================================
float readTurbidity(float &outV) {
  float s[3];
  for (int i = 0; i < 3; i++) {
    s[i] = countsToVolt(readADS_settled(TURB_CH));
    delay(12);
  }

  float a = s[0], b = s[1], c = s[2];
  float median = max(min(a, b), min(max(a, b), c));

  float diff = fabs(median - turbFiltered);
  float alpha = (diff < 0.03) ? 0.15 : (diff < 0.10 ? 0.07 : 0.03);

  if (turbFiltered == 0.0) turbFiltered = median;
  turbFiltered = turbFiltered * (1 - alpha) + median * alpha;

  float v = turbFiltered;
  if (v > TURBID_CLEAN_V) v = TURBID_CLEAN_V;
  if (v < TURBID_DIRTY_V) v = TURBID_DIRTY_V;

  float NTU = (TURBID_CLEAN_V - v) / (TURBID_CLEAN_V - TURBID_DIRTY_V) * NTU_MAX;
  if (NTU < 0) NTU = 0;
  if (NTU > NTU_MAX) NTU = NTU_MAX;

  outV = turbFiltered;
  return NTU;
}

// =======================================================
// TDS SENSOR
// =======================================================
float readTDS(float &outV) {
  float v = countsToVolt(readADS_settled(TDS_CH));

  float tds_raw =
    (133.42 * pow(v, 3) -
     255.86 * pow(v, 2) +
     857.39 * v) * 0.5;

  float ppm = tds_raw * TDS_K;
  if (ppm < 0) ppm = 0;

  outV = v;
  return ppm;
}

// =======================================================
// SD SAVE
// =======================================================
void saveToSD(const String &json) {
  File f = SD.open("/data.txt", FILE_APPEND);
  if (!f) {
    Serial.println("❌ SD WRITE FAILED");
    return;
  }
  f.println(json);
  f.close();
  Serial.println("📁 Saved to SD (offline)");
}

// =======================================================
// SD SYNC
// =======================================================
void uploadSDData() {
  if (!SD.exists("/data.txt")) return;

  Serial.println("🔁 Syncing SD data...");

  File f = SD.open("/data.txt", FILE_READ);
  if (!f) return;

  while (f.available()) {
    String line = f.readStringUntil('\n');
    if (line.length() < 5) continue;

    if (!WiFi.isConnected()) return;

    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;

    if (!http.begin(client, apiURL)) return;

    http.addHeader("Content-Type", "application/json");
    int code = http.POST(line);
    http.end();

    if (code >= 200 && code < 300) {
      Serial.println("✔ Synced");
    } else {
      Serial.println("❌ Sync failed, stopping");
      f.close();
      return;
    }
  }

  f.close();
  SD.remove("/data.txt");
  Serial.println("🧹 SD Cleared");
}

// =======================================================
// WiFi Reconnect
// =======================================================
void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("⚠ WiFi lost → reconnecting...");
  WiFi.disconnect();
  delay(200);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 8000) {
    Serial.print(".");
    delay(400);
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED)
    Serial.println("🔄 WiFi Reconnected");
  else
    Serial.println("❌ Still offline");
}

// =======================================================
// JSON BUILD
// =======================================================
String buildJson(float pH, float turb, float tds, float tempC, bool synced) {
  StaticJsonDocument<450> doc;

  doc["deviceId"] = DEVICE_ID;
  doc["timestamp_ms"] = millis();
  doc["synced"] = synced;

  JsonObject loc = doc.createNestedObject("location");
  loc["lat"] = LOCATION_LAT;
  loc["lon"] = LOCATION_LON;

  JsonObject s = doc.createNestedObject("sensors");
  s["PH"] = pH;
  s["Turbidity_NTU"] = turb;
  s["TDS_ppm"] = tds;
  s["Temperature_C"] = tempC;

  String out;
  serializeJson(doc, out);
  return out;
}

// =======================================================
// SEND LIVE DATA
// =======================================================
bool sendToBackend(const String &json) {
  if (!WiFi.isConnected()) return false;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  if (!http.begin(client, apiURL)) return false;

  http.addHeader("Content-Type", "application/json");
  int code = http.POST(json);
  http.end();

  return (code >= 200 && code < 300);
}

// =======================================================
// SETUP
// =======================================================
void setup() {
  Serial.begin(115200);
  delay(400);

  Wire.begin(21, 22);

  if (!ads.begin()) {
    Serial.println("ADS1115 not detected!");
    while (1);
  }
  ads.setGain(GAIN_ONE);

  WiFi.begin(ssid, password);

  if (SD.begin(SD_CS))
    Serial.println("SD READY");
  else
    Serial.println("❌ SD FAIL");

  Serial.println("=== Arogyajal Smart Node READY ===");
}

// =======================================================
// LOOP
// =======================================================
void loop() {

  float phV, turbV, tdsV;
  float pH   = readPH(phV);
  float turb = readTurbidity(turbV);
  float tds  = readTDS(tdsV);
  float temp = getFakeTemperature();

  maintainWiFi();

  bool online = WiFi.isConnected();
  String json = buildJson(pH, turb, tds, temp, online);

  // ---------------- CLEAN FINAL OUTPUT ----------------
  Serial.println("===== FINAL READINGS =====");
  Serial.print("pH = ");          Serial.println(pH, 2);
  Serial.print("Turbidity = ");   Serial.print(turb, 1); Serial.println(" NTU");
  Serial.print("TDS = ");         Serial.print(tds, 1);  Serial.println(" ppm");
  Serial.print("Temperature = "); Serial.print(temp, 2);  Serial.println(" °C");
  Serial.println("===========================");
  // ----------------------------------------------------

  if (!online || !sendToBackend(json)) {
    Serial.println("⚠ Sending failed → Saving offline");
    saveToSD(json);
  } else {
    Serial.println("🌐 LIVE DATA SENT");
    uploadSDData();
  }

  Serial.println("------------------------------------");
  delay(5000);
}
