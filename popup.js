window.onload = async () => {
    var errorMessage = document.querySelector('#error-message');
    var message = document.querySelector('#message');
    var data = undefined;

    let tab = await getCurrentWindow();
    if (tab != undefined) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: runContentScraping,
        });
        message.style.visibility = "visible";
        errorMessage.style.visibility = "hidden";
    } else {
        errorMessage.style.visibility = "visible";
        message.style.visibility = "hidden";
    }
}

chrome.runtime.onMessage.addListener((r, _) => {
    if (r.action == "getScraped") {
        data = r.source;
        message.innerText = JSON.stringify(data);
    }
});

copyBtn.addEventListener("click", async () => {
    let tab = await getCurrentWindow();

    if (tab != undefined) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: async () => {
                console.log("Copying data to clipboard!");

                var copyFrom = document.createElement("textarea");
                copyFrom.textContent = JSON.stringify(data);
                document.body.appendChild(copyFrom);
                copyFrom.select();
                document.execCommand('copy');
                copyFrom.blur();
                document.body.removeChild(copyFrom);
            },
        });
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

function runContentScraping() {
    console.log("Scraping content...");

    function convertBigNumStrToNum(numStr) {
        let multipliers = {
            "": 1,
            "K": 1e3,
            "M": 1e6,
            "B": 1e9
        };
        return parseFloat(numStr) * multipliers[numStr.charAt(numStr.length - 1).toUpperCase()].toString();
    }

    function getVideoLength(lengthStr) {
        return lengthStr.substring(6);
    }

    // scrape data from page
    userName = document.querySelector('[data-e2e="browse-username"]')?.textContent;
    likeCount = document.querySelector('[data-e2e="like-count"]')?.textContent;
    commentCount = document.querySelector('[data-e2e="comment-count"]')?.textContent;
    shareCount = document.querySelector('[data-e2e="share-count"]')?.textContent;
    videoDesc = document.querySelector('[data-e2e="browse-video-desc"]')?.textContent;
    musicInfo = document.querySelector('[data-e2e="browse-music"]')?.textContent;
    videoLength = document.querySelector("div[class*='DivSeekBarTimeContainer']")?.textContent;

    data = {
        'user_name': userName,
        'likes': convertBigNumStrToNum(likeCount),
        'comments': convertBigNumStrToNum(commentCount),
        'shares': convertBigNumStrToNum(shareCount),
        'description': videoDesc,
        'music': musicInfo,
        'length': getVideoLength(videoLength)
    };
    // console.log(data);

    chrome.runtime.sendMessage({
        "action": "getScraped",
        "source": data
    });
}

