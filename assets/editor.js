

function recurseAddLiElemsToHeirarchy(jsonList, parent) {
    
    if(jsonList === null) return;
    let keys = Object.keys(jsonList);

    for(let i = 0; i < keys.length; i++) {
        let newLi = document.createElement("li");
        let val = jsonList[keys[i]];
        
        if(val === 0) {
            newLi.innerText = keys[i];
            newLi.onclick = function(event) {
                openFile(buildFileName(newLi));
                event.stopPropagation();
            }
        } else {
            newLi.innerText = keys[i];
            newLi.classList.add("subfolder");

            let childUl = document.createElement("ul");
            childUl.hidden = true;

            newLi.onclick = function(event) {
                childUl.hidden = !childUl.hidden;

                if(childUl.hidden) Array.from(childUl.querySelectorAll("ul")).forEach(hul=>hul.hidden=true);

                //auto-openning
                if(childUl.childNodes.length == 1) childUl.firstElementChild.click();
                event.stopPropagation();
            }
            recurseAddLiElemsToHeirarchy(val, childUl);
            newLi.appendChild(childUl);
        }

        parent.appendChild(newLi);
    }
}
function buildFileName(element) {
    let result = element.firstChild.nodeValue;
    let currentNode = element;

    let iterations = 0;
    while(currentNode.parentElement.parentElement.tagName == "LI" && iterations < 100) {
        //only append slash if it's not on the first level 
        if(iterations > 0) result = currentNode.firstChild.nodeValue + "/" + result;
        else result = result;

        currentNode = currentNode.parentElement.parentElement;
        iterations++;
    }

    //root page
    if(iterations > 0) result = currentNode.firstChild.nodeValue + "/" + result;
    
    return result;
}
function openFile(fileName) {

    if(document.getElementById("edit-" + fileName.replace(/\//g,"-"))) {
        return document.getElementById("tab-edit-" + fileName.replace(/\//g,"-")).click();
    }
    let loadFileXhr = new XMLHttpRequest();

    loadFileXhr.open("GET", `/api/projects/${projectId}/files?file=` + encodeURIComponent(fileName));

    
    let fileTokens = fileName.split("/");
    let fileDots = fileName.split(".");

    let editorDiv = document.createElement("div");

    editorDiv.classList.add("editor-editor");
    editorDiv.classList.add(languages[fileDots[fileDots.length - 1]] || fileDots[fileDots.length - 1]);
    editorDiv.classList.add("editor-tab-content");
    editorDiv.id = "edit-" + fileName.replace(/\//g,"-");

    document.getElementById("code-editor").appendChild(editorDiv);

    let loadingCode = document.createElement("div");
    loadingCode.classList.add("code-load");
    editorDiv.appendChild(loadingCode);


    let tab = document.createElement("li");
    tab.classList.add("editor-tab");
    tab.id = "tab-" + editorDiv.id;

    tab.setAttribute("data-target",editorDiv.id);
    tab.innerText = fileTokens[fileTokens.length - 1];

    tab.onclick = function() {
        Array.from(document.getElementsByClassName("editor-tab-content")).forEach(x=>x.hidden=true);
        Array.from(document.getElementsByClassName("editor-tab")).forEach(x=>x.classList.remove("active"));

        editorDiv.hidden = false;
        tab.classList.add("active");
    }

    let delButton = document.createElement("a");
    delButton.innerHTML = "<span></span>";
    delButton.classList.add("del-button")

    delButton.onclick = function(event) {
        document.getElementById("open-editors").removeChild(tab); 
        document.getElementById("code-editor").removeChild(editorDiv);

        event.stopPropagation();
    }

    tab.appendChild(delButton);

    tab.click();

    document.getElementById("open-editors").appendChild(tab);

    loadFileXhr.onload = function() {
        if(loadFileXhr.status != 200) return loadingCode.classList.add("errored");
        editorDiv.removeChild(loadingCode);
        makeEditor(loadFileXhr.responseText, editorDiv);
    }
    loadFileXhr.onerror = function() {
        loadingCode.classList.add("errored");
    }

    loadFileXhr.send();
}