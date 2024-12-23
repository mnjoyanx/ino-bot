import {
  generateMacAddress,
  generateRandomDeviceId,
  loadScript,
} from "@/src/utils/util";
import Storege from "../storage/storage";

class Zeasn {
  id = "";
  mac = "";
  model = "zeasn";
  version = "";

  constructor() {}

  init() {
    window.addEventListener("keydown", (e) => {
      e.preventDefault();
    });

    return new Promise(async (resolve, reject) => {
      try {
        await loadScript(
          "https://cache.zeasn.tv/webstatic/homepage_web/deviceinfo/zeasn_deviceInfo_sdk.js",
        );
      } catch (e) {
        console.log(e);
      }

      try {
        if (/Android/i.test(navigator.userAgent)) {
          window.KeyCode.ENTER = window.KEYCODE_ENTER;
          window.KeyCode.LEFT = window.KEYCODE_DPAD_LEFT;
          window.KeyCode.RIGHT = window.KEYCODE_DPAD_RIGHT;
          window.KeyCode.UP = window.KEYCODE_DPAD_UP;
          window.KeyCode.DOWN = window.KEYCODE_DPAD_DOWN;
          window.KeyCode.N0 = window.KEYCODE_0;
          window.KeyCode.N1 = window.KEYCODE_1;
          window.KeyCode.N2 = window.KEYCODE_2;
          window.KeyCode.N3 = window.KEYCODE_3;
          window.KeyCode.N4 = window.KEYCODE_4;
          window.KeyCode.N5 = window.KEYCODE_5;
          window.KeyCode.N6 = window.KEYCODE_6;
          window.KeyCode.N7 = window.KEYCODE_7;
          window.KeyCode.N8 = window.KEYCODE_8;
          window.KeyCode.N9 = window.KEYCODE_9;
          window.KeyCode.RETURN = window.KEYCODE_BACK;
          window.KeyCode.RED = window.KEYCODE_PROG_RED;
          window.KeyCode.GREEN = window.KEYCODE_PROG_GREEN;
          window.KeyCode.YELLOW = window.KEYCODE_PROG_YELLOW;
          window.KeyCode.BLUE = window.KEYCODE_PROG_BLUE;
          window.KeyCode.PLAY = window.KEYCODE_MEDIA_PLAY;
          window.KeyCode.PAUSE = window.KEYCODE_MEDIA_PAUSE;
          window.KeyCode.PLAYPAUSE = window.KEYCODE_MEDIA_PLAY_PAUSE;
          window.KeyCode.STOP = window.KEYCODE_MEDIA_STOP;
          window.KeyCode.NEXT = window.KEYCODE_MEDIA_FAST_FORWARD;
          window.KeyCode.PREV = window.KEYCODE_MEDIA_REWIND;
          window.KeyCode.CH_UP = window.KEYCODE_CHANNEL_UP;
          window.KeyCode.CH_DOWN = window.KEYCODE_CHANNEL_DOWN;
        } else {
          window.KeyCode.ENTER = window.VK_ENTER;
          window.KeyCode.LEFT = window.VK_LEFT;
          window.KeyCode.RIGHT = window.VK_RIGHT;
          window.KeyCode.UP = window.VK_UP;
          window.KeyCode.DOWN = window.VK_DOWN;
          window.KeyCode.N0 = window.VK_0;
          window.KeyCode.N1 = window.VK_1;
          window.KeyCode.N2 = window.VK_2;
          window.KeyCode.N3 = window.VK_3;
          window.KeyCode.N4 = window.VK_4;
          window.KeyCode.N5 = window.VK_5;
          window.KeyCode.N6 = window.VK_6;
          window.KeyCode.N7 = window.VK_7;
          window.KeyCode.N8 = window.VK_8;
          window.KeyCode.N9 = window.VK_9;
          window.KeyCode.RETURN = window.VK_BACK;
          window.KeyCode.RED = window.VK_RED;
          window.KeyCode.GREEN = window.VK_GREEN;
          window.KeyCode.YELLOW = window.VK_YELLOW;
          window.KeyCode.BLUE = window.VK_BLUE;
          window.KeyCode.PLAY = window.VK_PLAY;
          window.KeyCode.PAUSE = window.VK_PAUSE;
          window.KeyCode.PLAYPAUSE = window.VK_PLAY_PAUSE;
          window.KeyCode.STOP = window.VK_STOP;
          window.KeyCode.NEXT = window.VK_FAST_FWD;
          window.KeyCode.PREV = window.VK_REWIND;
          window.KeyCode.CH_UP = window.VK_PAGE_UP;
          window.KeyCode.CH_DOWN = window.VK_PAGE_DOWN;
        }
      } catch (e) {}

      let deviceId = Storege.getDeviceId();
      let mac = Storege.getMac();
      let version = "0.0.0";

      if (mac) mac = mac.trim();
      if (deviceId) deviceId = deviceId.trim();

      if (mac && mac.length < 17) mac = "";

      if (typeof window.onDeviceInfoReady == "function") {
        window.onDeviceInfoReady((device = {}) => {
          if (!deviceId && device?.Product?.deviceID)
            deviceId = device.Product.deviceID;
          if (deviceId) deviceId = deviceId.trim();
          if (!deviceId) deviceId = generateRandomDeviceId();

          if (!mac && device?.Product?.mac) mac = device.Product.mac;
          if (mac) mac = mac.trim();
          if (mac && mac.length < 17) mac = "";
          if (!mac) mac = generateMacAddress("ZS" + deviceId);

          if (device?.Product?.firmwareVersion)
            version = device.Product.firmwareVersion;

          Storege.setDeviceId(deviceId);
          Storege.setMac(mac);

          this.id = deviceId;
          this.mac = mac;
          this.version = version;

          resolve();
        });
      } else {
        if (!deviceId) deviceId = generateRandomDeviceId();
        if (!mac) mac = generateMacAddress("ZS" + deviceId);

        Storege.setDeviceId(deviceId);
        Storege.setMac(mac);

        this.id = deviceId;
        this.mac = mac;
        this.version = version;

        resolve();
      }
    });
  }

  exit() {
    try {
      if (typeof window.SmartTvA_API == "function") {
        window.SmartTvA_API.exit();
        return;
      }

      if (document.referrer != "") {
        window.location.assign(document.referrer);
        return;
      }
    } catch (e) {
      console.log(e);
    }

    window.close();
  }
}

export default Zeasn;
