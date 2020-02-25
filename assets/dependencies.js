const depLoaders = {
    "fileTree": function (done) {
        let fileTreeXhr = new XMLHttpRequest();
        let projectId = /\/projects\/([\d\w-_]+)\//.exec(location.pathname)[1];
        fileTreeXhr.open("GET", `/api/projects/${projectId}/files/index.json`);

        fileTreeXhr.onload = function () {
            let parsedRes = JSON.parse(fileTreeXhr.responseText);

            document.getElementById("heirarchy").style.maxHeight = document.getElementById("heirarchy").clientHeight + "px";

            recurseAddLiElemsToHeirarchy(parsedRes, document.getElementById("heirarchy-inner"));

            done();

        };

        fileTreeXhr.send();
    },
    "codeEditor": function (done) {
        let style = document.createElement("link");
        style.setAttribute("rel", "stylesheet");
        style.setAttribute("href", "/editor.css");
        document.head.appendChild(style);

        let monacoScript = document.createElement("script");
        monacoScript.setAttribute("src", "https://unpkg.com/monaco-editor@0.18.1/min/vs/loader.js");
        document.head.appendChild(monacoScript);

        monacoScript.onload = function () {

            require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.18.1/min/vs/' } });
            window.MonacoEnvironment = {
                getWorkerUrl: function (workerId, label) {
                    return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = {
            baseUrl: 'https://unpkg.com/monaco-editor@0.18.1/min/'
            };
            importScripts('https://unpkg.com/monaco-editor@0.18.1/min/vs/base/worker/workerMain.js');`
                    )}`;
                }
            };

            require(["vs/editor/editor.main"], function () {

                document.getElementById("code-is-loading").parentElement.removeChild(document.getElementById("code-is-loading"));

                window.makeEditor = function (text, parentElem) {
                    let actualEditor = document.createElement("div");
                    actualEditor.classList.add("editor-editor");

                    parentElem.appendChild(actualEditor);

                    return monaco.editor.create(actualEditor, {
                        value: text,
                        language: parentElem.classList[1],
                        theme: "vs-dark",
                        formatOnPaste: true,
                        hover: {
                            enabled: true,
                            sticky: true
                        }
                    });
                }
                done();
            });
        }
    },
    "browserFileSystem": function (done) {
        let loadLoop = setInterval(function () {
            if (window.BrowserFS) {
                clearInterval(loadLoop);
                fetch('/browserfssys.zip').then(function (response) {
                    return response.arrayBuffer();
                }).then(function (zipData) {
                    BrowserFS.install(window);
                    var Buffer = BrowserFS.BFSRequire('buffer').Buffer;

                    BrowserFS.FileSystem.ZipFS.Create({
                        zipData: Buffer.from(zipData)
                    }, function (err, zipFs) {

                        BrowserFS.FileSystem.InMemory.Create({}, function(err, inMemFs) {
                            
                            BrowserFS.FileSystem.IndexedDB.Create({storeName: "codeHomeDir"}, function(err, indexDbFs) {

                                BrowserFS.FileSystem.MountableFileSystem.Create({
                                    "/sys": zipFs,
                                    "/tmp": inMemFs,
                                    "/home": indexDbFs
                                }, function (e, mfs) {
                                    if (e) {
                                        // An error occurred.
                                        console.log("ERROR ITS BAD");
                                        throw e;
                                    }

                                    console.log(mfs);

                                    BrowserFS.initialize(mfs);

                                    window.mountfs = mfs;

                                    // Otherwise, BrowserFS is ready to use!
                                    done();
                                });
                            });
                        });
                    });
                });
            }
        }, 1000);
    },
    "projectFiles": function (done) {
        let fs = require("fs");
        let projectId = /\/projects\/([\d\w-_]+)\//.exec(location.pathname)[1];

        let homeDirCreatedCb = function() {
            if (fs.existsSync(`/home/user/${projectId}`)) {
                done();
            } else {
                //TODO: download & mount the project folder

                BrowserFS.FileSystem.XmlHttpRequest.Create({
                    index: `/api/projects/${projectId}/files/index.json`
                }, function (e, xhrfs) {
                    mountfs.mount(`/dl/${projectId}`, xhrfs);
                    fs.rename(`/dl/${projectId}`, `/home/user/${projectId}`, function (err) {
                        done();
                    });
                });
            }
        };
        if (!fs.existsSync(`/home/user`)) fs.mkdir("/home/user", "rwx",homeDirCreatedCb);
        else homeDirCreatedCb();
    },
    "javaJVM": function (done) {
        return done();
        var process = BrowserFS.BFSRequire('process');
        process.initializeTTYs();

        new Doppio.VM.JVM({
            // '/sys' is the path to a directory in the BrowserFS file system with:
            // * vendor/java_home/*
            doppioHomePath: '/sys',
            // Add the paths to your class and JAR files in the BrowserFS file system
            classpath: ['.', '/sys/javalangserver/plugins', 'org.eclipse.equinox.launcher_1.5.700.v20200107-1357.jar']
        }, function (err, jvmObject) {
            console.log("DONE");
        });
    }
};