var config = module.exports;

config["TM tests"] = {
    rootPath: "../",
    environment: "browser",
    sources: [
        "lib/*.js",
        "jquery.trackmanipulation-3.10.js"
    ],
    tests: [
        "test/*-test.js"
    ]
}