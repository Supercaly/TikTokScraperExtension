window.onload = async () => {
    var errorMessage = document.querySelector('#error-message');
    var message = document.querySelector('#message');

    let tab = await getCurrentWindow();
    if (tab != undefined) {
        // let viewCountFrame = document.querySelector('#viewCountFrame');
        // videoId = tab.url.split('?')[0].split('/')[5];
        // viewCountFrame.setAttribute("src", "https://livecounts.io/embed/tiktok-live-view-counter/" + videoId.toString());

        message.style.visibility = "visible";
        errorMessage.style.visibility = "hidden";
    } else {
        errorMessage.style.visibility = "visible";
        message.style.visibility = "hidden";
    }
}

chrome.runtime.onMessage.addListener((r, s) => {
    if (r.action == "getScraped") {
        scrapedData = r.source;
        message.innerText = JSON.stringify(scrapedData);
        var copyFrom = document.createElement("textarea");
        copyFrom.textContent = JSON.stringify(scrapedData);
        document.body.appendChild(copyFrom);
        copyFrom.select();
        document.execCommand('copy');
        copyFrom.blur();
        document.body.removeChild(copyFrom);
    }
});

copyBtn.addEventListener("click", async () => {
    let tab = await getCurrentWindow();

    if (tab != undefined) {
        videoId = tab.url.split('?')[0].split('/')[5];

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [videoId],
            function: runContentScraping,
        });
        // chrome.scripting.executeScript({
        //     target: { tabId: tab.id },
        //     function: async () => {
        //         console.log("Copying data to clipboard!");
        //         // var copyFrom = document.createElement("textarea");
        //         // copyFrom.textContent = JSON.stringify(scrapedData);
        //         // document.body.appendChild(copyFrom);
        //         // copyFrom.select();
        //         // document.execCommand('copy');
        //         // copyFrom.blur();
        //         // document.body.removeChild(copyFrom);
        //     },
        // });
    } else {
        alert("error copying data!");
    }
});

getCurrentWindow = async () => {
    let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
        url: ["https://www.tiktok.com/*"]
    });
    return tab;
}

runContentScraping = async (videoId) => {
    console.log("Scraping content...");

    function convertBigNumStrToNum(numStr) {
        let multipliers = {
            "": 1,
            "K": 1e3,
            "M": 1e6,
            "B": 1e9
        };
        mult = multipliers[numStr.charAt(numStr.length - 1).toUpperCase()];
        return ((mult ?? 1) * parseFloat(numStr)).toString();
    }

    function getVideoLength(lengthStr) {
        return lengthStr.substring(6);
    }

    async function getViewsCount(id) {
        try {
            res = await fetch("https://tiktok.livecounts.io/video/" + id, {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
                    "if-none-match": "W/\"185-U+w1C2kyynYjVrIChxnHHEmqzXY\"",
                    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "x-aurora": "4962019298688",
                    "x-joey": "1654006432896",
                    "x-maven": "7e386c574ecba6cc3569c8533be0620e93e360cf910e20ab03f7f17eeed799ae",
                    "x-mayhem": "553246736447566b583139664546617a624464714e2f516c65435043703169576864662b6e7a414433465278434e723163367973686d4a5a4c544d4839477356",
                    "x-midas": "8c323a14ff9f737c53555592aaf4400923ad6477d4e54d31703fe558c476790e"
                },
                "referrer": "https://livecounts.io/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "omit"
            });
            data = await res.json();
            return data['followerCount']
        } catch (e) {
            console.log(e);
            return NaN;
        }
    }

    // scrape data from page
    userName = document.querySelector('[data-e2e="browse-username"]')?.textContent;
    likeCount = document.querySelector('[data-e2e="like-count"]')?.textContent;
    commentCount = document.querySelector('[data-e2e="comment-count"]')?.textContent;
    shareCount = document.querySelector('[data-e2e="share-count"]')?.textContent;
    videoDesc = document.querySelector('[data-e2e="browse-video-desc"]')?.textContent;
    musicInfo = document.querySelector('[data-e2e="browse-music"]')?.textContent;
    videoLength = document.querySelector("div[class*='DivSeekBarTimeContainer']")?.textContent;
    viewsCount = await getViewsCount(videoId);

    data = {
        'user_name': userName,
        'likes': convertBigNumStrToNum(likeCount),
        'comments': convertBigNumStrToNum(commentCount),
        'shares': convertBigNumStrToNum(shareCount),
        'description': videoDesc,
        'music': musicInfo,
        'length': getVideoLength(videoLength),
        'views': viewsCount.toString()
    };
    console.log(data);

    chrome.runtime.sendMessage({
        "action": "getScraped",
        "source": data
    });
}

