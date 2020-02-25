let projectId;

const languages = {
    "md": "markdown",
    "java": "java",
    "js": "javascript",
    "iml": "xml"
}
window.addEventListener("load", function() {
    projectId = /\/projects\/([\d\w-_]+)\//.exec(location.pathname)[1];
    
    recursiveLoadDeps(0);
});

function recursiveLoadDeps(index) {
    let vals = Object.values(depLoaders);
    let keys = Object.keys(depLoaders);

    log(`Loading ${keys[index]}...`);

    vals[index](function() {
        log(`Loaded ${keys[index]}`);
        if(index + 1 < vals.length) recursiveLoadDeps(index+1);
    });
}
function log(line) {
    document.getElementById("output-log").innerText += line + "\n";
}