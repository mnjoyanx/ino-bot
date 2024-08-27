import LOCAL_STORAGE from "./localStorage";

export default function os(callback) {
  if (window.tizen) {
    LOCAL_STORAGE.DEVICE_OS.SET("Tizen");

    let script = document.createElement("script");

    script.setAttribute("async", "true");

    script.src = "$WEBAPIS/webapis/webapis.js";

    script.onload = function () {
      let deviceId = null;
      let device_model = null;
      let device_name = null;
      let deviceIp = null;

      try {
        deviceId = webapis.productinfo.getDuid();
        device_model = webapis.productinfo.getModel();
        device_name = "Tizen";
        deviceIp = webapis.network.getIp();
      } catch (e) {
        deviceId = generateRandomDeviceId(12);
        device_model = generateRandomDeviceId(15);
        deviceIp = "1:1:1:1";

        device_name = "Tizen";
      }

      LOCAL_STORAGE.DEVICE_ID.SET(deviceId);
      LOCAL_STORAGE.DEVICE_MODEL.SET(device_model);
      LOCAL_STORAGE.DEVICE_NAME.SET(device_name);
      LOCAL_STORAGE.DEVICE_IP.SET(deviceIp);

      callback();
    };

    script.onerror = function () {
      const deviceId = generateRandomDeviceId(12);
      const device_model = generateRandomDeviceId(15);
      const device_name = "Tizen";

      LOCAL_STORAGE.DEVICE_ID.SET(deviceId);
      LOCAL_STORAGE.DEVICE_MODEL.SET(device_model);
      LOCAL_STORAGE.DEVICE_NAME.SET(device_name);

      callback();
    };

    document.head.appendChild(script);

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
  } else if (
    window.webOS &&
    window.webOS.platform &&
    window.webOS.platform.tv
  ) {
    LOCAL_STORAGE.DEVICE_OS.SET("Webos");

    webOS.service.request("luna://com.webos.service.sm", {
      method: "deviceid/getIDs",
      parameters: { idType: ["LGUDID"] },
      onSuccess: function (data) {
        let deviceId = null;
        let device_model = null;
        let device_name = null;

        if (data.idList && data.idList[0] && data.idList[0].idValue) {
          deviceId = data.idList[0].idValue;

          webOS.service.request("luna://com.webos.service.tv.systemproperty", {
            method: "getSystemInfo",
            parameters: { keys: ["modelName", "firmwareVersion"] },
            onComplete: function (inResponse) {
              device_model = inResponse.modelName;
              device_name = "WebOs";

              webOS.service.request("luna://com.palm.connectionmanager", {
                method: "getStatus",
                onSuccess: function (data) {
                  let device_ip = "";

                  if (data.wifi.ipAddress) device_ip = data.wifi.ipAddress;
                  else if (data.wired.ipAddress)
                    device_ip = data.wired.ipAddress;
                  else device_ip = "1.1.1.1";

                  LOCAL_STORAGE.DEVICE_IP.SET(device_ip);
                },
                onFailure: function (inError) {
                  let device_ip = "1.1.1.1";
                  LOCAL_STORAGE.DEVICE_IP.SET(device_ip);
                },
              });

              LOCAL_STORAGE.DEVICE_MODEL.SET(device_model);
              LOCAL_STORAGE.DEVICE_NAME.SET(device_name);

              callback();
            },

            onFailure: function (inError) {
              device_model = generateRandomDeviceId(15);
              device_name = "WebOs";

              LOCAL_STORAGE.DEVICE_MODEL.SET(device_model);
              LOCAL_STORAGE.DEVICE_NAME.SET(device_name);

              callback();
            },
          });
        } else {
          deviceId = generateRandomDeviceId(12);
          device_model = generateRandomDeviceId(15);
          device_name = "WebOs";
        }

        LOCAL_STORAGE.DEVICE_ID.SET(deviceId);
      },
      onFailure: function (err) {
        let deviceId = generateRandomDeviceId(12);
        let device_model = generateRandomDeviceId(15);
        let device_name = "WebOs";

        LOCAL_STORAGE.DEVICE_ID.SET(deviceId);
        LOCAL_STORAGE.DEVICE_MODEL.SET(device_model);
        LOCAL_STORAGE.DEVICE_NAME.SET(device_name);

        callback();
      },
    });
  } else if (window.Android) {
    document.body.classList.add("android");
    LOCAL_STORAGE.DEVICE_OS.SET("android");
    let device_name = "Android Tv";
    let device_model = window.Android.getModel();
    let deviceId = window.Android.getDeviceId();
    let deviceIp = window.Android.getIP();

    LOCAL_STORAGE.DEVICE_ID.SET(deviceId);
    LOCAL_STORAGE.DEVICE_MODEL.SET(device_model);
    LOCAL_STORAGE.DEVICE_NAME.SET(device_name);
    LOCAL_STORAGE.DEVICE_IP.SET(deviceIp);

    window.keydown = ({ keyName }) => {
      if (keyName == "back") {
        let data = { bubbles: true, cancelable: true, keyCode: 8 };
        document.dispatchEvent(new KeyboardEvent("keydown", data));
        // document.dispatchEvent(new KeyboardEvent("keyup", data));
      }
    };

    callback();
  } else {
    LOCAL_STORAGE.DEVICE_OS.SET("Webos");

    let deviceId = generateRandomDeviceId(12);
    let device_model = generateRandomDeviceId(15);
    let device_name = "WebOs";

    LOCAL_STORAGE.DEVICE_ID.SET(deviceId);
    LOCAL_STORAGE.DEVICE_MODEL.SET(device_model);
    LOCAL_STORAGE.DEVICE_NAME.SET(device_name);

    callback();
  }

  function generateRandomDeviceId(length) {
    if (LOCAL_STORAGE.DEVICE_ID.GET()) return LOCAL_STORAGE.DEVICE_ID.GET();

    let text = "";
    let possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }
}
