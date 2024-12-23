export const GoogleIMA = {
  isPlayling: false,

  destroy: function () {
    clearTimeout(this.timeout);

    this.isPlayling = false;

    if (this.adsLoader) this.adsLoader.destroy();

    if (this.adsManager) this.adsManager.destroy();

    if (this.adContainer) {
      this.adContainer.innerHTML = "";
      this.adContainer.classList.remove("show");
    }
  },

  init: function (data) {
    if (!window.google) return console.log("IMA couldn't be loaded");

    try {
      this.adContainer = data.adContainer;
      this.adContainer.onclick = function (e) {
        e.stopPropagation();
      };
      this.adTagUrl = data.adTagUrl;
      this.events = data.events || {};

      this.destroy();

      this.timeout = setTimeout(function () {
        GoogleIMA.start();
      }, data.timeout || 0);
    } catch (err) {
      this.onAdError(err);
    }
  },

  start: function () {
    this.rect = this.adContainer.getBoundingClientRect();

    this.adDisplayContainer = new google.ima.AdDisplayContainer(
      this.adContainer,
    );

    this.adsLoader = new google.ima.AdsLoader(this.adDisplayContainer);

    this.adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      this.onAdError,
      false,
      this,
    );

    this.adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      this.onAdsManagerLoaded,
      false,
      this,
    );

    this.adDisplayContainer.initialize();

    var adsRequest = new google.ima.AdsRequest();

    adsRequest.adTagUrl = this.adTagUrl;
    adsRequest.vastLoadTimeout = 30000;
    adsRequest.setContinuousPlayback = true;

    adsRequest.linearAdSlotWidth = this.rect.width;
    adsRequest.linearAdSlotHeight = this.rect.height;
    adsRequest.nonLinearAdSlotWidth = this.rect.width;
    adsRequest.nonLinearAdSlotHeight = this.rect.height / 3;

    this.adsLoader.requestAds(adsRequest);
  },

  onAdsManagerLoaded: function (adsManagerLoadedEvent) {
    try {
      var adsRenderingSettings = new google.ima.AdsRenderingSettings();
      adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

      this.adsManager = adsManagerLoadedEvent.getAdsManager(
        null,
        adsRenderingSettings,
      );

      console.log("this.adsManager", this.adsManager);

      var adEvents = [
        ["LOADED", this.onAdLoaded],
        ["STARTED", this.onStarted],
        ["COMPLETE", this.onAdEnded],
        ["AD_PROGRESS", this.addProgress],
      ];

      for (var adEvent of adEvents) {
        var event = google.ima.AdEvent.Type[adEvent[0]];
        this.adsManager.addEventListener(event, adEvent[1], false);
      }

      this.adsManager.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        this.onAdError,
        false,
        this,
      );

      this.adsManager.init(
        this.rect.width,
        this.rect.height,
        google.ima.ViewMode.NORMAL,
      );

      this.adsManager.start();
    } catch (adError) {
      console.log("Ad manager could not be started");
      this.onAdError();
    }
  },

  onAdLoaded: function () {
    if (GoogleIMA.adContainer && GoogleIMA.adContainer.firstChild) {
      GoogleIMA.adContainer.firstChild.style.width = "100%";
      GoogleIMA.adContainer.firstChild.style.height = "100%";
    }
  },

  onStarted: function () {
    GoogleIMA.isPlayling = true;
    if (GoogleIMA.adContainer) GoogleIMA.adContainer.classList.add("show");
    if (GoogleIMA.events.onAdStarted) GoogleIMA.events.onAdStarted();
  },

  addProgress: function (event) {
    if (GoogleIMA.events.onAdProgress) GoogleIMA.events.onAdProgress(event);
  },

  onAdEnded: function () {
    GoogleIMA.isPlayling = false;
    if (GoogleIMA.events.onAdEnded) GoogleIMA.events.onAdEnded();
    GoogleIMA.destroy();
  },

  onAdError: function (err) {
    GoogleIMA.isPlayling = false;
    if (GoogleIMA.events.onAdError) GoogleIMA.events.onAdError(err);
    GoogleIMA.destroy();
  },
};

function playAd() {
  GoogleIMA.init({
    timeout: 0, // milliseconds
    adTagUrl:
      "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
    adContainer: document.getElementById("add-container"),
    events: {
      onAdStarted: function () {
        console.log("ad started");
      },
      onAdProgress: function (data) {
        console.log("ad progress", data.getAdData());
      },
      onAdEnded: function () {
        console.log("ad ended");
      },
      onAdError: function (err) {
        console.log("ad error", err);
      },
    },
  });
}

(function () {
  var GoogleImaScript = document.createElement("script");
  GoogleImaScript.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";

  GoogleImaScript.onload = function () {
    console.log("Google IMA loa2222222ded");
  };

  GoogleImaScript.onerror = function () {
    console.log("Google IMA couldn't be loaded");
  };

  document.body.appendChild(GoogleImaScript);
})();
