class Browser {

    id = "";
    mac = "";
    model = "webos";
    version = "";

    constructor() { }

    async init() {

        return new Promise((resolve, reject) => {
            this.id = "1234567890";
            this.mac = "77:77:77:77:77:77";
            this.model = "webos";
            this.version = "1.0.0";
            resolve();
        });
    }

    exit() {
        window.close();
    }

}

export default Browser;