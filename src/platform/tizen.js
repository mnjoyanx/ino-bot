import {
  generateMacAddress,
  generateRandomDeviceId,
  loadScript,
} from "@/src/utils/util";
import Storege from "../storage/storage";

class Tizen {
  id = "";
  mac = "";
  model = "tizen";
  version = "";

  constructor() {}

  async init() {
    try {
      await loadScript("$WEBAPIS/webapis/webapis.js");
    } catch (e) {
      console.log(e);
    }

    try {
      window.tizen.tvinputdevice.registerKeyBatch([
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "ChannelUp",
        "ChannelDown",
        "MediaRewind",
        "MediaFastForward",
        "MediaPause",
        "MediaPlay",
        "MediaStop",
        "MediaTrackPrevious",
        "MediaTrackNext",
        "MediaPlayPause",
        "ColorF0Red",
        "ColorF1Green",
        "ColorF2Yellow",
        "ColorF3Blue",
        "ChannelList",
      ]);
    } catch (e) {}

    return new Promise((resolve, reject) => {
      let deviceId = Storege.getDeviceId();

      try {
        if (!deviceId) deviceId = window.webapis.productinfo.getDuid();
      } catch (e) {}

      if (!deviceId) deviceId = generateRandomDeviceId();

      Storege.setDeviceId(deviceId);

      let mac = Storege.getMac();

      try {
        if (!mac) mac = window.webapis.network.getMac();
      } catch (e) {}

      if (!mac) mac = generateMacAddress(deviceId);

      Storege.setMac(mac);

      let version = "0.0.0";

      try {
        version = window.webapis.tvinfo.getVersion();
      } catch (e) {}

      this.id = deviceId;
      this.mac = mac;
      this.version = version;

      resolve();
    });
  }

  exit() {
    try {
      window.tizen.application.getCurrentApplication().exit();
    } catch (e) {
      window.close();
    }
  }
}

export default Tizen;
