// ==UserScript==
// @name         Fanbox爬取器
// @name:en      Fanbox Scraper
// @namespace    http://tampermonkey.net/
// @namespace    https://github.com/709924470/pixiv_fanbox_downloader
// @version      beta_1.9.19
// @description  Download Pixiv Fanbox Images.
// @description:en  Download Pixiv Fanbox Images.
// @author       rec_000@126.com
// @match        https://www.pixiv.net/fanbox/creator/*/post
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.0/jszip.min.js
// ==/UserScript==

(function() {
    var regex = /https:\/\/www.pixiv.net\/fanbox\/creator\/(\d+)\/post/g;
    var userid = regex.exec(window.location)[1];
    var url = "https://www.pixiv.net/ajax/fanbox/creator?userId=" + userid;
    var dlList = [];
    var downloaded = 0;
    console.warn("Still in development! DO NOT USE!\n仍在开发中, 切勿使用!")
    return;
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function(response) {
            var postUrl = "https://fanbox.pixiv.net/api/post.info?postId=";
            var data = JSON.parse(response.responseText);
            for(var i in data.body.post.items){
                if (data.body.post.items[i] === undefined){
                    continue;
                }
                GM_xmlhttpRequest({
                    method: "GET",
                    url: postUrl + data.body.post.items[i].id,
                    onload: function(response) {
                        var data = JSON.parse(response.responseText);
                        for (var j in data.body.images){
                            var fileName = data.body.title + "|" + data.body.user.name + "_" + j + "." + data.body.images[j].extension;
                            forceDownload(data.body.images[j].originalUrl, fileName, false);
                        }
                    }
                });
            }
            while(data.body.post.nextUrl || data.body.nextUrl){
                GM_xmlhttpRequest({
                    method: "GET",
                    url: data.body.post.nextUrl,
                    onload: function(response){
                        data = JSON.parse(response.responseText);
                        for (var i in data.body.items){
                            for (var j in data.body.items[i].body.images){
                                var fileName = data.body.items[i].title + "|" + data.body.items[i].user.name + "_" + j + "." + data.body.items[i].body.images[j].extension;
                                forceDownload(data.body.items[i].body.images[j].originalUrl, fileName, false);
                            }
                        }
                    }
                });
            }
        }
    });
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