import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectConfigs } from "@app/configs/configsSlice";
import LOCAL_STORAGE from "@utils/localStorage";

export const useImageFallback = (src) => {
  const configs = useSelector(selectConfigs);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
    };
    img.onerror = () => {
      const defaultLogo = configs?.basics?.logo || LOCAL_STORAGE.LOGO.GET();
      setImageSrc(defaultLogo || "");
    };
  }, [src, configs]);

  return imageSrc;
};
