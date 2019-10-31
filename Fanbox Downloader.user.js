// ==UserScript==
// @name         Fanbox图片下载器
// @name:en      Fanbox Downloader
// @namespace    http://tampermonkey.net/
// @namespace    https://github.com/709924470/pixiv_fanbox_downloader
// @version      beta_1.14.514.1919.8.10
// @description  Download Pixiv Fanbox Images.
// @description:en  Download Pixiv Fanbox Images.
// @author       rec_000@126.com
// @match        https://www.pixiv.net/fanbox/creator/*/post/*
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.0/jszip.min.js
// ==/UserScript==

(function() {
    'use strict';
    var dlList = [];
    var observer = new MutationObserver(rootObserver);
    var observeFlag = false;
    var lastLoc = window.location.href;
    observer.observe(document.getElementById("root"), { childList: true });
    var count = 0, downloaded = 0;
    var zip;
    var timeoutBackup;
    function rootObserver(mutations) {
        mutations.forEach(function(mutation) {
            for (var i = 0; i < mutation.addedNodes.length; i++){
                if (window.location.href !== lastLoc){
                    console.log("[Fanbox Downloader.js] Page refresh detected.");
                    lastLoc = window.location.href;
                    observeFlag = false;
                    timeoutBackup = setInterval(function(){
                        if(!observeFlag){
                            document.querySelectorAll("button").forEach(
                                function(e){
                                    if(e.innerHTML.includes("svg")){
                                        observeFlag = mainFunc(e);
                                        if(observeFlag){
                                            console.log("[Fanbox Downloader.js] Backup function working...");
                                            clearInterval(timeoutBackup);
                                        }
                                    }
                                }
                            );
                        }else{
                            clearInterval(timeoutBackup);
                        }
                    }, 1000);
                }
                if(!observeFlag){
                    observeFlag = mainFunc(null);
                    observer.observe(mutation.addedNodes[i],
                        {
                            childList: true,
                            characterData: true, 
                            subtree: true
                        });
                }else{
                    break;
                }
            }
        });
    }
    function checkIsSub(){
        var result = false;
        document.getElementsByTagName("a").forEach(
            function(e){
                if(e.href.contains("plan")){
                    result = result | document.getElementsByTagName("ARTICLE")[0].contains(e);
                }
            }
        );
        return !result;
    }
    function mainFunc(btn){
        //observer.disconnect();
        zip = new JSZip();
        count = 0;
        var button = document.evaluate('//*[@id="root"]/div[5]/div[1]/div/div[3]/div/div/div[1]/div/div[1]/div/button', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        button = button.singleNodeValue;
        if ((button === null && btn === null) || !checkIsSub()){
            console.error("[Fanbox Downloader.js] Cannot add download button!" + (checkIsSub() ? "" : "REASON=\"NOT_IN_FAN_PLAN\""));
            return false;
        }else if(button !== null || btn !== null){
            button = button ? button : btn;
        }
        console.log("[Fanbox Downloader.js] Successfully added the button.");
        var newButton = document.createElement("button");
        button.classList.forEach(function(item){
            newButton.classList.add(item);
        });
        newButton.id = "dl_images";
        newButton.innerText = "下载图片\nDirect download";
        newButton.onclick = function(){
            downloadImages(...getAllImageUrl());
        };
        button.parentNode.appendChild(newButton);
        var zipButton = document.createElement("button");
        button.classList.forEach(function(item){
            zipButton.classList.add(item);
        });
        zipButton.id = "dl_zip";
        zipButton.innerText = "打包下载\nDownload as Zip";
        zipButton.onclick = function(){
            downloadImages_ZIP(...getAllImageUrl());
        };
        button.parentNode.appendChild(zipButton);
        return true;
    }
    function downloadImages(...urls){
        if(!checkIsSub()){
            alert("t5RIf eB1rsCBus Ot D3En UOy");
            return "Why are you even thinking about download these files free???"
        }
        urls.forEach(function(url){
            forceDownload(url,generateName(url),false);
        });
        return undefined;
    }
    function downloadImages_ZIP(...urls){
        if(!checkIsSub()){
            alert("t5RIf eB1rsCBus Ot D3En UOy");
            return "Why are you even thinking about download these files free???"
        }
        var i = 0;
        urls.forEach(function(url){
            if(url === undefined){
                console.warn("undefined url! > [" + i + "]" , urls);
                i++;
                return;
            }
            forceDownload(url,generateName(url),true);
            i++;
        });
        return undefined;
    }
    function getAllImageUrl(){
        var elements = document.querySelectorAll("img.lazyloaded, img.lazyloading, img.lazyload");
        var result = [];
        for(var i = 0; i < elements.length; i++){
            result.push(elements[i].parentNode.parentNode.getAttribute("href"));
        }
        return result;
    }
    function generateName(url){
        return document.title.split("｜")[0] + ( "_" + count++ ) + "." + url.split(".")[url.split(".").length - 1];
    }
    function addFile(name,content){
        zip.file(name,content);
    }
    function forceDownload(url, fileName,zipFlag){
        if(dlList.includes(fileName)){
            return;
        }
        dlList.push(fileName);
        console.log("[Fanbox Downloader.js] Downloading " + fileName);
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            binary: true,
            responseType: "blob",
            onload: function(response) {
                console.log("[Fanbox Downloader.js] Downloaded " + fileName);
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(response.response);
                if(!zipFlag){
                    var tag = document.createElement('a');
                    tag.href = imageUrl;
                    tag.download = fileName;
                    document.body.appendChild(tag);
                    tag.click();
                    document.body.removeChild(tag);
                    return;
                }
                addFile(fileName,response.response);
                downloaded++;
                if(dlList.length == downloaded){
                    zip.generateAsync({type:'blob'}).then(function(blob){
                        var imageUrl = urlCreator.createObjectURL(blob);
                        var tag = document.createElement('a');
                        tag.href = imageUrl;
                        tag.download = document.title.split("｜")[0] + ".zip";
                        document.body.appendChild(tag);
                        tag.click();
                        document.body.removeChild(tag);
                    });
                }
            },
            onprogress: function (e) {
                if(e.callengthComputable){
                    var ratio = Math.floor((e.loaded / e.total) * 100) + '%';
                    console.log("[Fanbox Downloader.js] " + fileName + " > " + ratio);
                    return;
                }
                console.log("[Fanbox Downloader.js] " + fileName + " downloaded " + (e.loaded / 1024).toFixed(3) + "kB (No total length found)");
            },
            onerror: function(e){
                console.error("[Fanbox Downloader.js] Failed downloading file " + fileName);
            },
        });
    }
})();
