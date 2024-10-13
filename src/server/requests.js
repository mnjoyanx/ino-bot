import { request } from "./request";
import { CONFIG } from "./config";

export const getLanguages = () => {
  return request(
    "get",
    CONFIG.LANGUAGES // -> endpoint
  );
};

export const getAppSettings = (body) => {
  return request(
    "get",
    CONFIG.APP_CONFIGS, // -> endpoint
    "",
    body
  );
};

export const getChannels = (queryParams) => {
  return request(
    "get",
    CONFIG.GET_CHANNELS, // -> endpoint
    queryParams,
    ""
  );
};

export const getChannelCategories = (queryParams) => {
  return request(
    "get",
    CONFIG.CATEGORIES_CHANNEL, // -> endpoint
    queryParams,
    ""
  );
};
export const channelInfo = (queryParams) => {
  return request(
    "get",
    CONFIG.CHANNEL_INFO, // -> endpoint
    queryParams,
    ""
  );
};

export const launcherRegister = (body) => {
  return request(
    "post",
    CONFIG.LAUNCHER_REGISTER, // -> endpoint
    "",
    body
  );
};

export const getlLauncherUser = (body) => {
  return request(
    "get",
    CONFIG.GET_LAUNCHER_USER, // -> endpoint
    body,
    ""
  );
};

export const loginUser = (body) => {
  return request(
    "post",
    CONFIG.LOGIN_USER, // -> endpoint
    "",
    body
  );
};

export const getEpgList = (body) => {
  return request(
    "post",
    CONFIG.EPG_LIST, // -> endpoint
    "",
    body
  );
};
export const getProfile = (body) => {
  return request(
    "post",
    CONFIG.GET_PROFILE, // -> endpoint
    "",
    body
  );
};

// export const singIn = body => {
//   return request(
//     "post",
//     "user/login", // -> endpoint
//     "",
//     body,
//   );
// };

// export const singUp = body => {
//   return request(
//     "post",
//     "user/online/register", // -> endpoint
//     "",
//     body,
//   );
// };

// export const signOut = body => {
//   return request("delete", "v2/api/user/logout", body);
// };

// export const validateToken = body => {
//   return request(
//     "post",
//     "user/validateToken", // -> endpoint
//     "",
//     body,
//   );
// };

// export const getSearchResults = queryParams => {
//   return request(
//     "get",
//     "user/smart/search", // -> endpoint
//     queryParams,
//   );
// };

// export const loginGuestMode = body => {
//   return request(
//     "post",
//     "user/auth/login_guest", // -> endpoint
//     "",
//     body,
//   );
// };

// export const getHighlightedMovies = queryParams => {
//   return request(
//     "get",
//     "application/vod/movie/highlighted", // -> endpoint
//     queryParams,
//   );
// };

// export const getContentCategories = queryParams => {
//   return request(
//     "get",
//     "v2/api/genre", // -> endpoint
//     queryParams,
//   );
// };

export const getAllMovies = (queryParams) => {
  return request(
    "get",
    "v2/api/movies", // -> endpoint
    queryParams,
    ""
  );
};

export const getAllGenres = (queryParams) => {
  return request("get", "v2/api/genre", queryParams, "");
};

export const getMovieById = (queryParams) => {
  return request("get", "v2/api/movies/info", queryParams);
};

// export const getAdsMovie = queryParams => {
//   return request("get", "v2/api/ads/by_movie_id", queryParams);
// };

// export const getCastsMovie = queryParams => {
//   return request("get", "v2/api/cast/by_movie_id", queryParams);
// };

// export const getCountriesMovie = queryParams => {
//   return request("get", "v2/api/countries/by_movie_id", queryParams);
// };

// export const getSeasons = queryParams => {
//   return request("get", "v2/api/season/by_movie_id", queryParams);
// };

// export const getEpisodes = queryParams => {
//   return request("get", "v2/api/episode/by_season_id", queryParams);
// };

// export const getTranslationsMovie = queryParams => {
//   return request("get", "v2/api/movie_translations/by_movie_id", queryParams);
// };

// export const getRating = queryParams => {
//   return request("get", "v2/api/rating/by_movie_id", queryParams);
// };

// export const getGenre = queryParams => {
//   return request("get", "v2/api/genre/by_movie_id", queryParams);
// };

// export const getChannels = queryParams => {
//   return request("get", "v2/api/channels", queryParams);
// };

// export const getChannelInfo = queryParams => {
//   return request("get", "v2/api/channels/info", queryParams);
// };

// export const getRelatedContent = queryParams => {
//   return request("get", "application/vod/movie/related", queryParams);
// };

// export const addFavorite = body => {
//   return request("post", "application/vod/movie/addFavorite", "", body);
// };

// export const removeFavorite = body => {
//   return request("post", "application/vod/movie/removeFavorite", "", body);
// };

export const addLiveFavorite = (body) => {
  return request("post", "user/channels/addFavorite", "", body);
};

export const removeLiveFavorite = (body) => {
  return request("post", "user/channels/deleteFavorite", "", body);
};

// export const getMovieUrl = queryParams => {
//   return request("get", "application/vod/movie/url", queryParams);
// };
