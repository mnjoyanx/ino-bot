import Android from "./android";
import Browser from "./browser";
import Zeasn from "./zeasn";
import Tizen from "./tizen";
import Vewd from "./vewd";
import Vidaa from "./vidaa";
import Vizio from "./vizio";
import Webos from "./webos";

class Platform {
  id = "";
  mac = "";
  model = "";
  version = "";
  userAgent = "";

  async init() {
    let query = location.pathname.split("?").pop();

    const params = {};

    if (query) {
      query = query.split("&");

      for (let i = 0; i < query.length; i++) {
        const param = query[i].split("=");
        params[param[0]] = param[1];
      }
    } else {
      query = {};
    }

    this.userAgent = navigator.userAgent;

    if (/webos|web0s/i.test(this.userAgent))
      // LG
      var platform = new Webos();
    else if (/tizen/i.test(this.userAgent))
      // samsung
      var platform = new Tizen();
    else if (window.Android)
      // android
      var platform = new Android();
    else if (
      params.os == "foxxum" ||
      /nettv|sraf|tcl|iServer|WhaleTV/i.test(this.userAgent)
    )
      // zeasn or foxxum
      var platform = new Zeasn();
    else if (/vizio|smartcast|conjure/i.test(this.userAgent))
      // vizio
      var platform = new Vizio();
    else if (/"vidaa|hisense/i.test(this.userAgent))
      // vidaa
      var platform = new Vidaa();
    else if (params.os == "vewd")
      // vewd
      var platform = new Vewd(); // browser
    else var platform = new Browser();

    await platform.init();

    this.id = platform.id;
    this.mac = platform.mac;
    this.model = platform.model;
    this.version = platform.version;
    this.exit = platform.exit;

    document.body.classList.add(this.model);
  }
}

export default Platform;
