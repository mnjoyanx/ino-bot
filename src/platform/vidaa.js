import { generateMacAddress, generateRandomDeviceId } from "@/src/utils/util";
import Storege from "../storage/storage";

class Vidaa {

    id = "";
    mac = "";
    model = "vidaa";
    version = "";
    canPlay4k = false;

    constructor() { }

    async init () {

        return new Promise((resolve, reject) => {

            let deviceId = Storege.getDeviceId();

            try {
                if (!deviceId) deviceId = window.Hisense_GetDeviceID();
            } catch (e) { }

            if (!deviceId) deviceId = generateRandomDeviceId();

            Storege.setDeviceId(deviceId);

            let mac = Storege.getMac();

            if (!mac) mac = generateMacAddress(deviceId);

            Storege.setMac(mac);

            let version = "0.0.0";

            try {
                version = window.Hisense_GetOSVersion();
            } catch (e) { }

            this.id = deviceId;
            this.mac = mac;
            this.version = version;

            window.KeyCode.RED = window.VK_RED;
            window.KeyCode.GREEN = window.VK_GREEN;
            window.KeyCode.YELLOW = window.VK_YELLOW;
            window.KeyCode.BLUE = window.VK_BLUE;
            window.KeyCode.BACK = window.VK_BACK_SPACE;
            window.KeyCode.EXIT = window.VK_EXIT;
            window.KeyCode.STOP = window.VK_STOP;
            window.KeyCode.NEXT = window.VK_FAST_FWD;
            window.KeyCode.PREV = window.VK_REWIND;
            window.KeyCode.PLAY = window.VK_PLAY;
            window.KeyCode.PAUSE = window.VK_PAUSE;
            window.KeyCode.PLAYPAUSE = window.VK_PLAY_PAUSE;

            resolve();

        });
    }

    exit () {
        window.close();
    }

}

export default Vidaa;