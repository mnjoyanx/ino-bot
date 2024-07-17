const LOCAL_STORAGE = {
  CLEAR: () => localStorage.clear(),

  MAC_ADDRESS: {
    GET: () => localStorage.getItem("mac_address"),
    SET: (mac) => localStorage.setItem("mac_address", mac),
  },

  DEVICE_ID: {
    GET: () => localStorage.getItem("device_id"),
    SET: (id) => {
      if (
        localStorage.getItem("device_id") === null ||
        !localStorage.getItem("device_id")
      ) {
        localStorage.setItem("device_id", id);
      }
    },
  },

  DEVICE_MODEL: {
    GET: () => localStorage.getItem("device_model"),
    SET: (model) => {
      if (
        localStorage.getItem("device_model") === null ||
        !localStorage.getItem("device_model")
      ) {
        localStorage.setItem("device_model", model);
      }
    },
  },

  DEVICE_NAME: {
    GET: () => localStorage.getItem("device_name"),
    SET: (name) => {
      if (
        localStorage.getItem("device_name") === null ||
        !localStorage.getItem("device_name")
      ) {
        localStorage.setItem("device_name", name);
      }
    },
  },

  DEVICE_OS: {
    GET: () => localStorage.getItem("device_os"),
    SET: (os) => localStorage.setItem("device_os", os),
  },

  TOKEN: {
    GET: () => localStorage.getItem("TOKEN"),
    SET: (token) => localStorage.setItem("TOKEN", token),
  },

  LANGUAGE: {
    GET: () => JSON.parse(localStorage.getItem("language")),
    SET: (language) =>
      localStorage.setItem("language", JSON.stringify(language)),
  },

  LAST_CHANNEL_ID: {
    GET: () => localStorage.getItem("last_channel_id"),
    SET: (id) => localStorage.setItem("last_channel_id", id),
  },

  LOGO: {
    GET: () => localStorage.getItem("logo"),
    SET: (logo) => localStorage.setItem("logo", logo),
  },
};

export default LOCAL_STORAGE;
