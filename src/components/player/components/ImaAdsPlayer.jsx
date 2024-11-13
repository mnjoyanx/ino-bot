import { useEffect, useRef } from "react";

const ImaAdsPlayer = ({ videoElement, adTagUrl, onAdComplete }) => {
  const adsLoaderRef = useRef(null);
  const adsManagerRef = useRef(null);

  useEffect(() => {
    // Pause the main video when component mounts (ad starts)
    if (videoElement) {
      videoElement.pause();
    }

    // Load IMA SDK script
    const script = document.createElement("script");
    script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = initializeIMA;

    return () => {
      if (adsManagerRef.current) {
        adsManagerRef.current.destroy();
      }
      document.head.removeChild(script);
    };
  }, []);

  const initializeIMA = () => {
    // Initialize IMA SDK
    const adDisplayContainer = new google.ima.AdDisplayContainer(
      document.getElementById("adContainer"),
      videoElement,
    );
    adDisplayContainer.initialize();

    // Create ads loader
    adsLoaderRef.current = new google.ima.AdsLoader(adDisplayContainer);

    // Add event listeners
    adsLoaderRef.current.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
    );

    adsLoaderRef.current.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
    );

    // Request ads
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = adTagUrl;
    adsRequest.linearAdSlotWidth = videoElement.clientWidth;
    adsRequest.linearAdSlotHeight = videoElement.clientHeight;

    adsLoaderRef.current.requestAds(adsRequest);
  };

  const onAdsManagerLoaded = (adsManagerLoadedEvent) => {
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();

    adsManagerRef.current = adsManagerLoadedEvent.getAdsManager(
      videoElement,
      adsRenderingSettings,
    );

    // Add event listeners for ad events
    adsManagerRef.current.addEventListener(
      google.ima.AdEvent.Type.COMPLETE,
      onAdComplete,
    );

    // Add pause content event listener
    adsManagerRef.current.addEventListener(
      google.ima.AdEvent.Type.STARTED,
      () => {
        if (videoElement) {
          videoElement.pause();
        }
      },
    );

    try {
      adsManagerRef.current.init(
        videoElement.clientWidth,
        videoElement.clientHeight,
        google.ima.ViewMode.NORMAL,
      );
      adsManagerRef.current.start();
    } catch (adError) {
      console.error("Ads manager initialization error:", adError);
      if (videoElement) {
        videoElement.play();
      }
      onAdComplete();
    }
  };

  const onAdError = (adErrorEvent) => {
    console.error("Ad error:", adErrorEvent.getError());
    if (adsManagerRef.current) {
      adsManagerRef.current.destroy();
    }
    if (videoElement) {
      videoElement.play();
    }
    onAdComplete();
  };

  return (
    <div
      id="adContainer"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default ImaAdsPlayer;
