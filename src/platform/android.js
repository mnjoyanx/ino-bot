import { generateMacAddress, generateRandomDeviceId } from "@/src/utils/util";
import Storege from "../storage/storage";

class Android {

    id = "";
    mac = "";
    model = "android";
    version = "";
    platform = "";

    constructor() { }

    async init() {

        if ((/nettv|sraf|tcl|iServer|WhaleTV/i).test(navigator.userAgent)) {
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
        }

        document.documentElement.style.fontSize = "5px";

        window.addEventListener("keydown", (e) => {
            e.preventDefault();
        });

        window.keydown = ({ keyName }) => {

            if (keyName == "back") {
                let data = { bubbles: true, cancelable: true, key: "back" }
                document.dispatchEvent(new KeyboardEvent("keydown", data));
                document.dispatchEvent(new KeyboardEvent("keyup", data));
            }

        }

        document.addEventListener("visibilitychange", (e) => {

            if (document.visibilityState == "hidden") {

                try {
                    window.Android.setPlayerPositions(1, 1, 0, 0, window.innerWidth, window.innerHeight);
                    window.Android.destroyPlayer();
                } catch (e) {
                    console.log(e);
                }

            }

        });

        window.addEventListener("close", () => {

            try {
                window.Android.setPlayerPositions(1, 1, 0, 0, window.innerWidth, window.innerHeight);
                window.Android.destroyPlayer();
            } catch (e) {
                console.log(e);
            }

        });

        return new Promise((resolve, reject) => {

            try {
                window.Android.destroyPlayer();
                window.Android.setPlayer('EXO');
            } catch (e) {
                console.log(e);
            }

            try {

                let [androidVersion, versionName, versionCode] = window.Android.getVersion().split("|");

                if (!androidVersion) androidVersion = "0";
                if (!versionName) versionName = "0.0.0";
                if (!versionCode) versionCode = "0";

                this.version = `OS-v${androidVersion} App-v${versionName}(${versionCode})`;

            } catch (e) {
                this.version = "0.0.0";
                console.log(e);
            }

            let { mac, deviceId } = this.getMacAndDeviceId();

            this.id = deviceId;
            this.mac = mac;
            this.model = "android";

            resolve();

        });

    }

    getMacAndDeviceId() {

        let mac = Storege.getMac();
        let deviceId = Storege.getDeviceId();

        try {
            if (!deviceId) deviceId = window.Android.getDeviceId();
        } catch (e) {
            console.log(e);
        }

        if (!deviceId) deviceId = generateRandomDeviceId();
        if (!mac) mac = generateMacAddress(deviceId);

        Storege.setDeviceId(deviceId);
        Storege.setMac(mac);

        return { mac, deviceId };

    }

    exit() {

        try {
            window.Android.exitApp();
        } catch (e) {
            console.log(e);
        }

    }

}

export default Android;