var TV_URL = "";
var video = "";

function play_channel(url) {
    TV_URL = url;

    if (OS == "tizen") {
        play_av_player();
    } else {
        play_web();
    }
}

function play_web() {
    video.addEventListener(
        "error",
        function (e) {
            tv_loading.style.display = "none";
        },
        false
    );

    video.src = TV_URL;

    video.addEventListener("loadedmetadata", function () {
        video.play();
        tv_loading.style.display = "none";
    });
}

function play_av_player(retry) {
    if (retry == undefined) retry = 0;

    webapis.avplay.close();

    webapis.avplay.open(TV_URL);

    try {
        webapis.avplay.prepareAsync(
            function () {
                video.style.display = "block";
                webapis.avplay.play();
                set_display_area();
            },
            function (e) {
                if (retry < 5) {
                    retry++;
                    setTimeout(function () {
                        play_av_player(retry);
                    }, 200);
                } else {
                    show_alert(e.message);
                }
            }
        );
    } catch (e) {
        console.log(e);
    }
}

function player_set_home_screen() {
    var position = document.getElementById("video_parent").getBoundingClientRect();

    var x = parseInt(position.left);
    var y = parseInt(position.top);
    var width = parseInt(position.width);
    var height = parseInt(position.height);

    webapis.avplay.setDisplayRect(x, y, width, height);
}

function player_set_full_screen() {
    webapis.avplay.setDisplayRect(0, 0, window.innerWidth, window.innerHeight);
}

function set_display_area() {
    if (OS == "tizen") {
        if (fullScreen) {
            player_set_full_screen();
        } else {
            player_set_home_screen();
        }
    }
}

var listener = {
    onbufferingstart: function () {
        // console.log("onbufferingstart");
    },
    onbufferingcomplete: function () {
        // console.log("onbufferingcomplete");
    },
    onstreamcompleted: function () {},
    oncurrentplaytime: function (currentTime) {},
    ondrmevent: function (drmEvent, drmData) {},
    onerror: function (type, data) {
        // console.log(type, data);
    },
    onbufferingprogress: function (percent) {},
    onevent: function (eventType, eventData) {},
    onsubtitlechange: function (duration, text, data3, data4) {},
};

var error = {
    video_ERROR_NONE: "Playlist Error, please check with your provider",
    video_ERROR_INVALID_PARAMETER: "Error invalid parameter",
    video_ERROR_NO_SUCH_FILE: "No such file",
    video_ERROR_INVALID_OPERATION: "Invalid operation",
    video_ERROR_SEEK_FAILED: "Error seek field",
    video_ERROR_INVALID_STATE: "Invalid state",
    video_ERROR_NOT_SUPPORTED_FILE: "Not supported file",
    video_ERROR_INVALID_URI: "Invalid url",
    video_ERROR_CONNECTION_FAILED: "Connection field",
    video_ERROR_GENEREIC: "Playlist Error, please check with your provider",
};

function check_player(cb) {
    if (OS == "tizen") {
        video = document.createElement("object");
        video.setAttribute("type", "application/avplayer");
        video.style.display = "none";

        webapis.avplay.setListener(listener);

        cb();
    } else {
        video = document.createElement("video");
        video.setAttribute("autoplay", true);
    }

    video.setAttribute("id", "video");

    document.getElementById("video_parent").appendChild(video);
}
