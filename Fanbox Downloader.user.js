// ==UserScript==
// @name         Fanbox图片下载器
// @name:en      Fanbox Downloader
// @namespace    http://tampermonkey.net/
// @namespace    https://github.com/709924470/pixiv_fanbox_downloader
// @version      beta_1.14.514
// @description  Download Pixiv Fanbox Images.
// @description:en  Download Pixiv Fanbox Images.
// @author       rec_000@126.com
// @match        https://www.pixiv.net/fanbox/creator/*/post/*
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js
// ==/UserScript==

(function() {
    'use strict';
    var dlList = [];
    var observer = new MutationObserver(rootObserver);
    var observeFlag = true;
    observer.observe(document.getElementById("root"), { childList: true });
    var count = 0, downloaded = 0;
    var zip;
    function rootObserver(mutations) {
        mutations.forEach(function(mutation) {
            for (var i = 0; i < mutation.addedNodes.length; i++){
                if(mutation.addedNodes[i].innerText.includes("点赞")){
                    mainFunc();
                    observeFlag = false;
                }
                if(!observeFlag){
                    break;
                }
                observer.observe(mutation.addedNodes[i],{ childList: true, characterData: true, subtree: true });
            }
        });
    }
    function mainFunc(){
        //observer.disconnect();
        zip = new JSZip();
        count = 0;
        //console.log("Trying to add a button...");
        var buttons = document.getElementsByTagName("button");
        var button = null;
        for(var i = 0; i < buttons.length; i++){
            var b = buttons[i];
            if(b !== undefined && b.innerText.includes("点赞")){
                button = b;
                break;
            }
        }
        if(button === null){
            console.warn("An error caused by can not find element.");
            return;
        }
        var newButton = document.createElement("button");
        button.classList.forEach(function(item){
            newButton.classList.add(item);
        });
        newButton.id = "dl_images";
        newButton.innerText = "下载图片";
        newButton.onclick = function(){
            downloadImages(...getAllImageUrl());
        };
        button.parentNode.appendChild(newButton);
        var zipButton = document.createElement("button");
        button.classList.forEach(function(item){
            zipButton.classList.add(item);
        });
        zipButton.id = "dl_zip";
        zipButton.innerText = "打包下载";
        zipButton.onclick = function(){
            downloadImages_ZIP(...getAllImageUrl());
        };
        button.parentNode.appendChild(zipButton);
    }
    function downloadImages(...urls){
        urls.forEach(function(url){
            forceDownload(url,generateName(url),false);
        });
        return undefined;
    }
    function downloadImages_ZIP(...urls){
        urls.forEach(function(url){
            forceDownload(url,generateName(url),true);
        });
        return undefined;
    }
    function getAllImageUrl(){
        var elements = document.getElementsByClassName("lazyloaded");
        var result = [];
        for(var i = 0; i < elements.length; i++){
            var item = elements[i];
            if(item.tagName == "IMG"){
                result.push(item.parentElement.href);
            }
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
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            binary: true,
            responseType: "blob",
            onload: function(response) {
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
            }
        });
    }
})();
