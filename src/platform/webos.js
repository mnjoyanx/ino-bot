import {
  generateMacAddress,
  generateRandomDeviceId,
  getBundleJsHost,
  loadScript,
} from "@/src/utils/util";
import Storege from "../storage/storage";

class Webos {
  id = "";
  mac = "";
  model = "webos";
  version = "";

  constructor() {}

  async init() {
    try {
      const host = getBundleJsHost();
      await loadScript(`${host}webOSTV.js`);
    } catch (e) {
      console.log(e);
    }

    return new Promise(async (resolve, reject) => {
      try {
        const macAndDeviceId = await this.getMacAndDeviceId();

        const systemInfo = await this.getSystemInfo();

        // let macAndDeviceId = { mac: "11:11:11:11:11:11", deviceId: "123123123123" }

        // let systemInfo = {
        //     "UHD": "true",
        //     "modelName": "43UN74006LA",
        //     "firmwareVersion": "04.50.52", // Software Version
        //     "sdkVersion": "5.5.0", // webOS TV version
        //     "returnValue": true
        // }

        const { mac, deviceId } = macAndDeviceId;

        const { sdkVersion } = systemInfo;

        this.id = deviceId;
        this.mac = mac;
        this.version = sdkVersion;

        resolve();
      } catch (e) {
        console.log(e);

        return this.init();

        // this.id = "123456789101112";
        // this.mac = "00:00:00:00:00:00";
        // this.version = "0.0.0";

        // resolve();
      }
    });
  }

  async getMacAndDeviceId() {
    return new Promise(async (resolve, reject) => {
      const mac = Storege.getMac();

      const deviceId = await this.getDeviceId();

      const success = (mac) => {
        if (!mac) mac = generateMacAddress(deviceId);

        Storege.setMac(mac);

        resolve({ mac, deviceId });
      };

      if (mac) return success(mac);

      window.webOS.service.request(
        "luna://com.webos.service.connectionmanager",
        {
          method: "getinfo",
          parameters: {},
          onSuccess: (data = { wifiInfo: {}, wiredInfo: {} }) => {
            success(data.wifiInfo?.macAddress || data.wiredInfo?.macAddress);
          },
          onFailure: () => {
            success(null);
          },
        },
      );
    });
  }

  async getSystemInfo() {
    return new Promise((resolve, reject) => {
      window.webOS.service.request(
        "luna://com.webos.service.tv.systemproperty",
        {
          method: "getSystemInfo",
          parameters: {
            keys: ["modelName", "firmwareVersion", "UHD", "sdkVersion"],
          },
          onSuccess: (args) => {
            resolve(args);
          },
          onFailure: () => {
            resolve({
              UHD: false,
              modelName: "",
              firmwareVersion: "0.0.0",
              sdkVersion: "0.0.0",
              returnValue: true,
            });
          },
        },
      );
    });
  }

  async getDeviceId() {
    return new Promise((resolve) => {
      const deviceId = Storege.getDeviceId();

      const success = (deviceId) => {
        if (!deviceId) deviceId = generateRandomDeviceId();

        Storege.setDeviceId(deviceId);

        resolve(`${deviceId}`);
      };

      if (deviceId) return success(deviceId);

      window.webOS.service.request("luna://com.webos.service.sm", {
        method: "deviceid/getIDs",
        parameters: { idType: ["LGUDID"] },
        onSuccess: (data) => {
          success(data?.idList[0]?.idValue);
        },
        onFailure: () => {
          success(null);
        },
      });
    });
  }

  exit() {
    try {
      window.webOS.platformBack();
    } catch (e) {
      window.close();
    }
  }
}

export default Webos;
