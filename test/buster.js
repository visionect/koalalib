var config = module.exports;

config["TM tests"] = {
    rootPath: "../",
    environment: "browser",
    sources: [
        "lib/*.js",
        "jquery.trackmanipulation.js"
    ],
    tests: [
        "test/*-test.js"
    ]
}