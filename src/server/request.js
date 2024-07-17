import { constructQueryString } from "@utils/util";
import LOCAL_STORAGE from "@utils/localStorage";
const baseUrl = "http://api.inorain.tv/";

export const request = async (
  method = "GET",
  url,
  queryParams = {},
  data = null
) => {
  url = baseUrl + url;

  const queryString = constructQueryString(queryParams);
  if (queryString) {
    url += "?" + queryString;
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        resolve(xhr.responseText);
      }
    };
    xhr.open(method, url, true);
    if (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT") {
      if (LOCAL_STORAGE.TOKEN.GET() && LOCAL_STORAGE.TOKEN.GET() != "undefined")
        xhr.setRequestHeader("authorization", LOCAL_STORAGE.TOKEN.GET());

      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
    } else {
      if (LOCAL_STORAGE.TOKEN.GET() && LOCAL_STORAGE.TOKEN.GET() != "undefined")
        xhr.setRequestHeader("authorization", LOCAL_STORAGE.TOKEN.GET());
      xhr.send();
    }
  });
};
