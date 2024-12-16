import { generateMacAddress, generateRandomDeviceId, loadScript } from "@/src/utils/util";
import Storege from "../storage/storage";

class Vizio {

    id = "";
    mac = "";
    model = "vizio";
    version = "";

    constructor() { }

    async init () {

        try {
            await loadScript("http://localhost:12345/scfs/cl/js/vizio-companion-lib.js");
        } catch (e) { }

        return new Promise((resolve, reject) => {

            document.addEventListener("VIZIO_LIBRARY_DID_LOAD", () => {

                let deviceId = Storege.getDeviceId();

                try {
                    if (!deviceId) deviceId = window.VIZIO.getDeviceId();
                } catch (e) { }

                if (!deviceId) deviceId = generateRandomDeviceId();

                Storege.setDeviceId(deviceId);

                let mac = Storege.getMac();

                if (!mac) mac = generateMacAddress(deviceId);

                Storege.setMac(mac);

                let version = "0.0.0";

                try {
                    version = window.VIZIO.getFirmwareVersion();
                } catch (e) { }

                this.id = deviceId;
                this.mac = mac;
                this.version = version;

                resolve();

            });

        });

    }

    exit () {
        try {
            window.VIZIO.exitApplication()
        } catch (e) {
            window.close();
        }
    }

}

export default Vizio;