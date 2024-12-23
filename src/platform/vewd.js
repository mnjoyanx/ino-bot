import {
  generateMacAddress,
  generateRandomDeviceId,
  loadScript,
} from "@/src/utils/util";
import Storege from "../storage/storage";

class Vewd {
  id = "";
  mac = "";
  model = "vewd";
  version = "";

  constructor() {}

  async init() {
    return new Promise((resolve, reject) => {
      let deviceId = Storege.getDeviceId();

      if (!deviceId) deviceId = generateRandomDeviceId();

      Storege.setDeviceId(deviceId);

      let mac = Storege.getMac();

      if (!mac) mac = generateMacAddress(deviceId);

      Storege.setMac(mac);

      this.id = deviceId;
      this.mac = mac;
      this.version = "0.0.0";

      resolve();
    });
  }

  exit() {
    window.close();
  }
}

export default Vewd;
