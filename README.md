# ESP OTA Server
A simple express server to upload and serve OTA updates to your ESP.  
I specifically use it to be able to OTA update devices that are mostly in deep sleep.

## Usage
### Prepare the binary
To not have to find out the device MAC address and have a hard time handeling it, I chose to embed a name string in the binary. 
This can be done by adding the following line to your sketch:
```c++
const char* NAME __attribute__((used)) = "name=your-esp-name";
```
The `name=` is important for later and also for finding this string in the binary.  
Allowed symbols are alphanumerical, `-` and `_`.

All you have to do to enable OTAs is to define an update function:
```c++
#include <ESP8266httpUpdate.h>
//...
void check_ota() {
  ESP8266HTTPUpdate ota;
  ota.rebootOnUpdate(1);
  char path[50];
  char url[] = "server.com"; // <-- Add your host URL/IP here
  sprintf(path, "/ota?%s", NAME);
  // "client" is your WiFi client
  t_httpUpdate_return ret = ota.update(client, url, 42420, path); // <-- 42420 is the port the server listens to
  switch(ret) {
    case HTTP_UPDATE_FAILED:
        Serial.println("[update] Update failed.");
        break;
    case HTTP_UPDATE_NO_UPDATES:
        Serial.println("[update] Update no Update.");
        break;
    case HTTP_UPDATE_OK:
        Serial.println("[update] Update ok."); // may not be called since we reboot the ESP
        break;
  }
}
```
(This code is partly taken from the [esp8266 Arduino core documentation](https://github.com/esp8266/Arduino/blob/master/doc/ota_updates/readme.rst).)

Your binary is now ready. The first time you need to manually flash it to your device.

### Start the server
#### NodeJS
Just install the dependencies (`npm install`) and then run `npm run start`. The server is now listening on port 42420/tcp. 
All data (binaries and mapping) can be found in the newly created subfolder `data`.

#### Docker
Built and run the application. Make sure to forward a port to port 42420/tcp in the container. 
The volume where all data (binaries and mapping) is located at `/app/data` in the container.

#### Both
If you change the port (e.g. by using Dockers port mapping) be aware that you also need to change the port in the binary.  
Visit `/` to upload your binary files. You will see the name it finds and the MD5 of the binary.

## Disclaimer
Be aware that this was built for my private use.
I'm not planning to perfectly optimize this solution.
There is no encryption for communication.
If you need more information about OTA updates for ESP visit [their documentation](https://arduino-esp8266.readthedocs.io/en/latest/ota_updates/readme.html).
