var config = module.exports;

config["TM tests"] = {
    rootPath: "../",
    environment: "browser",
    sources: [
        "lib/*.js",
        "okular.js"
    ],
    tests: [
        "test/*-test.js"
    ]
}
