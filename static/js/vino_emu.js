/* eslint-disable */
let loadingCube = null;
let loadingX = 0;
let loadingY = 0;
let loadingW = 0;
let loadingH = 0;
if (typeof vino === "undefined") {
    // If not on a WiiU, emulate the Vino and WiiU Gamepad APIs.
    console.log("Initialize API emulation");
    if (typeof wiiu === "undefined") {
        ((window.wiiu = {}),
            (window.wiiu.gamepad = { update: function () { } }));
    }

    // fake console data
    var debugConsole = {
        nnid: "prodtest1",
        name: "Vino Debug",
        mii: "AwEAQBs8xqsHR9PC3MXz5YXEaBemLwAAVllEAGEAdgBpAGQAIABKAG8AYQBxAExRABBXAAJoRBgTZEUUgRIZZg4AACkAaGdQYgBpAGcAIABzAGEAbAB0AHkAAAAAAC96",
        pid: 1788259488,
        country: "US",
        language: "EN",

        fl: "1236925795,1166356730,1409518437,1088392656,1090934832,1573645812,1672254576,1746347141,1112166243,1773702389,1541552688,1679086960,1609011959,1371173300,1426703823,1381149235,1338603408,1122156854,1309239659,1427220684,1498872945,1468960081,1029645862,1092713399,1413957266,1106036020,1637587789,1391350154,1672305136,1098860494",
    };

    window.vino = {
        wakeKeyboard: function () {
            console.log("Focus keyboard to: " + document.activeElement);
        },
        requestGarbageCollect: function () {
            console.log("Requested Garbage collection");
        },
        acr_setHostName: function (hostname) { },
        acr_setPort: function (port) { },
        acr_startMatching: function (gain, msec, times, conf, msecxtimes) { },
        acr_stopMatching: function () { },
        acr_getLastResult: function () { },
        acr_getRemainedTime: function () { },
        acr_getHostName: function () {
            return "acr-test.i.tv";
        },
        acr_getPort: function () {
            return "8443";
        },
        title_getImageCount: function () {
            return 0;
        },
        title_hasImage: function (img) {
            return false;
        },
        title_setFixedImage: function (url, id, n1, n2, n3, type) {
            return true;
        },
        title_clearImage: function () {
            return true;
        },
        soundStopAll: function () {
            console.log("Stop all sounds");
        },
        ls_getItem: function (key) {
            return localStorage.getItem(key);
        },
        ls_setItem: function (key, value) {
            localStorage.setItem(key, value);
            return true;
        },
        ls_removeItem: function (key) {
            localStorage.removeItem(key);
        },
        ls_clear: function () {
            localStorage.clear();
        },
        ls_key: function (index) {
            return localStorage.key(index);
        },
        ls_length: function () {
            return localStorage.length;
        },
        lyt_setIsEnableClientLoadingIcon: function (show) {
            console.log((show ? "Show" : "Hide") + " blue loading icon");
        },
        lyt_setIsEnableWhiteMask: function (withmask) {
            console.log((withmask ? "With" : "Without") + " white mask");
        },
        lyt_startTouchEffect: function () {
            console.log("Show touch effect");
        },
        lyt_setFixedFrameSemitransparency: function (set) { },
        lyt_startTouchEffectToFocused: function () {
            console.log("Show touch effect to focused");
        },
        lyt_reset: function () {
            if (document.querySelector(".lyt_draw")) {
                document.querySelector(".lyt_draw").remove();
            }
            console.log("Reset lyt");
        },
        lyt_decideFixedFrame: function () {
            if (document.querySelector(".lyt_draw")) {
                document.querySelector(".lyt_draw").remove();
            }
            console.log("Decide lyt");
        },
        lyt_drawFixedFrame: function (one, two, three, four) {
            if (document.querySelector(".lyt_draw")) {
                document.querySelector(".lyt_draw").remove();
            }
            function drawBox() {
                document.removeEventListener("DOMContentLoaded", drawBox);
                var div = document.createElement("div");
                div.classList.add("lyt_draw");
                div.style.position = "absolute";
                div.style.left = one + "px";
                div.style.top = two + "px";
                div.style.width = three + "px";
                div.style.height = four + "px";
                div.style.border = "4px solid red";
                div.style.backgroundColor = "rgb(255 0 0 / 10%)";
                div.style.boxSizing = "border-box";
                div.style.pointerEvents = "none"; // optional: so it doesn't block interaction
                div.style.zIndex = "9998"; // ensure it's on top

                document.body.appendChild(div);

                console.log("Drew frame at " + one, two, three, four);
            }

            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", drawBox);
            } else {
                drawBox();
            }
        },
        lyt_startTouchNodeEffect: function (one, two, three, four) {
            console.log("Show touch mouse effect at " + one, two, three, four);
        },
        video_enableOnTV: function (bool) {
            console.log("Enable video on TV is " + bool);
        },
        emulate_touch: function (one, two, three) {
            console.log("Emulate touch at " + one, two, three);
        },
        emulate_inputDelay: function (one) {
            console.log("Emulate input delay in " + one + " seconds");
        },
        exit: function () {
            console.log("Exit app");
        },
        exitForce: function () {
            console.log("Forcing exit app");
        },
        isReturnedFromOtherApplication: function () {
            console.log("App was not returned from other application");
            return false;
        },
        runOliveErrorDialog: function (errorCode) {
            alert(errorCode + "\n\n" + "An Miiverse error occurred.");
        },
        runErrorDialog: function (errorCode) {
            alert(errorCode + "\n\n" + "An Vino error occurred.");
        },
        olv_getErrorCodeOnInitialize: function () {
            return null;
        },
        runSingleButtonDialog: function (msg, btnStr) {
            alert(msg + "\n\n[ " + (btnStr ? btnStr : "OK") + " ]");
        },
        runTwoButtonDialog: function (msg, lBtnStr, rBtnStr) {
            return !confirm(
                msg +
                "\n\n[ " +
                (lBtnStr ? lBtnStr : "Cancel") +
                " ]  [ " +
                (rBtnStr ? rBtnStr : "OK") +
                " ]"
            );
        },
        info_getCountry: function () {
            return debugConsole.country;
        },
        info_getLanguage: function () {
            return debugConsole.language;
        },
    loading_setIconRect: function (x, y, w, h) {
        loadingX = x;
        loadingY = y;
        loadingW = w;
        loadingH = h;
        console.log("Set loading icon position at", x, y, w, h);

        if (!loadingCube) return;
        loadingCube.style.left = loadingX + "px";
        loadingCube.style.top = loadingY + "px";
        loadingCube.style.width = loadingW + "px";
        loadingCube.style.height = loadingH + "px";
    },

    loading_setIconAppear: function (show) {
        if (show) {
            if (!loadingCube) {
                // create cube
                loadingCube = document.createElement("div");
                loadingCube.style.position = "fixed";
                loadingCube.style.left = loadingX + "px";
                loadingCube.style.top = loadingY + "px";
                loadingCube.style.width = loadingW + "px";
                loadingCube.style.height = loadingH + "px";
                loadingCube.style.zIndex = "9999";
                loadingCube.style.background = "rgba(0,0,0,0.5)";
                loadingCube.style.opacity = "0";
                loadingCube.style.display = "block";
                loadingCube.style.transition = "opacity 0.1s ease"; // fast fade-in
                document.body.appendChild(loadingCube);

                // trigger fade-in
                requestAnimationFrame(() => {
                    loadingCube.style.opacity = "1";
                });
            } else {
                // already exists → only fade-in if hidden
                if (loadingCube.style.display === "none" || loadingCube.style.opacity === "0") {
                    loadingCube.style.display = "block";
                    loadingCube.style.transition = "opacity 0.1s ease"; // fade-in faster
                    requestAnimationFrame(() => {
                        loadingCube.style.opacity = "1";
                    });
                }
            }
        } else {
            if (loadingCube) {
                // fade out with slower speed
                loadingCube.style.transition = "opacity 0.4s ease"; 
                loadingCube.style.opacity = "0";
                setTimeout(() => {
                    if (loadingCube) {
                        loadingCube.style.display = "none";
                    }
                }, 500); // match fade-out duration
            }
        }

        console.log((show ? "Show" : "Hide") + " loading icon.");
    },

    loading_setIconVisibility: function (show) {
        if (!loadingCube) return;
        loadingCube.style.transition = "none"; // disable animation
        loadingCube.style.opacity = show ? "1" : "0";
        loadingCube.style.display = show ? "block" : "none";
        // restore transition defaults for appear
        setTimeout(() => {
            if (loadingCube) {
                loadingCube.style.transition = "opacity 0.2s ease"; // keep fade-in default
            }
        }, 0);

        console.log(
            (show ? "Instantly show" : "Instantly hide") + " loading icon."
        );
    },
        soundPlay: function (soundLabel) {
            console.log("Played sound effect " + soundLabel);
            return 1;
        },
        soundPlayEx: function (soundLabel, delay) {
            console.log(
                "Played sound effect " + soundLabel + " with delay " + delay
            );
            return 1;
        },
        soundPlayVolume: function (soundLabel, vol) {
            console.log(
                "Played sound effect " + soundLabel + " with volume " + vol
            );
            return 1;
        },
        soundStop: function (soundId) { },
        ir_enableCodeset: function (one) {
            console.log("Enabled IR codeset " + one);
        },
        ir_existsTvCodeset: function () {
            return true;
        },
        ir_existsOtherCodeset: function () {
            return false;
        },
        ir_isEnabled: function () {
            return true;
        },
        ir_send: function (one, two) {
            console.log("Sent IR code " + one);
        },
        ir_muteOneShotSound: function (bool) {
            console.log("IR sound is enabled?: " + bool);
        },
        navi_reset: function () { },
        navi_setToFocused: function () {
        },
        navi_getRect: function () {
            return;
        },
        navi_setMoveMethod: function (one) {
            console.log("Set move method " + one);
        },
        navi_setBaseVisibilityOnKeyEvent: function (bool) {
            console.log("Base visibility is " + bool);
        },
        navi_setBaseVisibility: function (bool) {
            console.log("Base visibility is " + bool);
        },
        navi_set: function (one, two, three, four) {
        },
        navi_decide: function () { },
        act_getCurrentSlotNo: function () {
            console.log('Returned account slot "1"');
            return 1;
        },
        act_getMiiImage: function (slot) {
            console.log("Returned Mii image from " + slot);
            return (
                "https://pretendo-cdn.b-cdn.net/mii/" +
                debugConsole.pid +
                "/normal_face.png"
            );
        },
        act_getMiiImageEx: function (slot, expression) {
            console.log(
                "Returned Mii image from " +
                slot +
                " with expression " +
                expression
            );
            var imageUrl;
            switch (expression) {
                case 7:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/body.png";
                    break;
                case 2:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/smile_open_mouth.png";
                    break;
                case 3:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/wink_left.png";
                    break;
                case 4:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/surprised_open_mouth.png";
                    break;
                case 5:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/frustrated.png";
                    break;
                case 6:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/sorrow.png";
                    break;
                default:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/normal_face.png";
                    break;
            }
            return imageUrl;
        },
        act_getMiiData: function (slot) {
            console.log("Returned Mii data from " + slot);
            return debugConsole.mii;
        },
        act_getNum: function () {
            console.log("Returned number of accounts");
            return 1;
        },
        act_getName: function (slot) {
            console.log("Returned Mii name from " + slot);
            return debugConsole.name;
        },
        act_getPid: function (slot) {
            console.log("Returned account PID from " + slot);
            return debugConsole.pid;
        },
        act_getAgeDivision: function (slot) {
            console.log("Returned account age division from " + slot);
            return 1;
        },
        apd_isEnabled: function () {
            console.log("APD is enabled on console");
            return true;
        },
        apd_getPeriod: function () {
            console.log("Return APD period");
            return 6200;
        },
        apd_enable: function () {
            console.log("APD has been enabled");
            return true;
        },
        apd_disable: function () {
            console.log("APD has been disabled");
            return false;
        },
        memo_open: function (state) {
            console.log(
                (state ? "Open with reset" : "Open without reset") + " memo UI"
            );
            return true;
        },
        memo_reset: function () {
            console.log("Memo UI was reset");
            return true;
        },
        memo_isFinish: function () {
            console.log("Memo UI finished");
            return true;
        },
        memo_getImagePng: function () {
            console.log("Return memo UI image");
            return "data:image/png;base64,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";
        },
        memo_getImageTgaRaw: function () {
            console.log("Return memo UI raw image");
            return "eJzt2EFu60YQBFAlqxwjR8mxcvsEfyEgEWxxPKQ41T3vAd6SxVZPgfTj8fvj6a/f/n78+cc/AAAAAAAAAAAAAAAAAAAAAAAAAABc5vF4/O8PyOfMnvPae9/9ATmc1XNGe89sIY9zOm9kXuYLmbynzJudkxlDBt9qc66YjRnDWvrv566eiznDOjpw3KfmYc6whv4b98l5mDWsoQOPfXoOneZsd6hE/x27Yw7VZ22HqGrXDhx93qT+S/1tdt0h6tttd0ef987nP7pPQsbvpMwQZu2wv7O9t7oD03K+y52WDUZ0392ZZ7l7Dl9df/S+K38r/UcHXff3TP47Z/F63Zn7VOhASNRtf6/I/a6Trp7Jlde++/fSf3TQZYevyvvdNa6eySfmnPgeCMk69N/VWd9d45MdeNaq36vq3sAvlfsv4cyvvMYd16xwb5hVtf9W50v9n93quUAlVb+BE7LNZvh09oTZQAUV+y8p10wW/Qc5KvVf9Ux35U+cEyTSf+eN5Loze+qcIE2V/kvL8+pdvhXZ0+cFCar8DzApy1f0H9RTof9Schx5zblyhlVmBqvpv+ukzK/SzGCl5P5LyPBTCbNbfX+oIvkbePX9Z63OW3VucDf914+5wTj914+ZwZjUd0D9B3ya/gN2pv+AXXkHZIbfhw5S++81GxnSdgTOSu2/ZzZyJO4InJH8DkgOO0JH+o8RdoSudCBH7Add6T+O2A8604H3qzRPu0Fn+u9e1WZqN+iu+44n5a820+67AZ13PO0Z0vIc6bwb8Evnb+C0/Gl5jnTdC3jSf/tlGdV1L+C/Ou55Wva0PCM67gW86rjnadnT8ozouBfwquM3cFrutDwjuu0EfKVb/yVmTsx0pNNOwDuddj0xc2KmI512At7psuuJeRMzjeiyEzCiw54nZk7MNEL/sZMOe56YOTHTCP3Hjirvd2L2xEwj9B/UknY20/L8hP6DOhLPZWKmUSP9V/G5oKPEM5mYaZT+gzrSzmRanhn6D2pIO5NpeWboP6gh7Uym5Zmh/9hZlT1PzJmY6af0Hzuqtu9p+dLyzNJ/7KbivqflS8szS/+xm4o7n5YtLc+skV2o/ozwVHHf03Kl5Tmj4j7ArIr7npYrLc9Z1fYBZum/ayRlOavaPsCsav2XmKmbajsBs6rtemKmbqrtBJxRbc8TM3Wj/9iFPeeV/mM39psn38DArvQfsDP9B+zKOyCwK/0H7Ez/AbvyDgjsSv8BO9N/wK68AwK70n/AzvQfsCvvgMCu9B+wM/0H7Er/AbvSf8DOdB+wK/0H7E7vAQAAAAAAAAAAAACQ4l8iHjJS";
        },
        memo_getImageTgaCompressed: function () {
            console.log("Return memo UI compressed image");
            return "eJzt2EFu60YQBFAlqxwjR8mxcvsEfyEgEWxxPKQ41T3vAd6SxVZPgfTj8fvj6a/f/n78+cc/AAAAAAAAAAAAAAAAAAAAAAAAAABc5vF4/O8PyOfMnvPae9/9ATmc1XNGe89sIY9zOm9kXuYLmbynzJudkxlDBt9qc66YjRnDWvrv566eiznDOjpw3KfmYc6whv4b98l5mDWsoQOPfXoOneZsd6hE/x27Yw7VZ22HqGrXDhx93qT+S/1tdt0h6tttd0ef987nP7pPQsbvpMwQZu2wv7O9t7oD03K+y52WDUZ0392ZZ7l7Dl9df/S+K38r/UcHXff3TP47Z/F63Zn7VOhASNRtf6/I/a6Trp7Jlde++/fSf3TQZYevyvvdNa6eySfmnPgeCMk69N/VWd9d45MdeNaq36vq3sAvlfsv4cyvvMYd16xwb5hVtf9W50v9n93quUAlVb+BE7LNZvh09oTZQAUV+y8p10wW/Qc5KvVf9Ux35U+cEyTSf+eN5Loze+qcIE2V/kvL8+pdvhXZ0+cFCar8DzApy1f0H9RTof9Schx5zblyhlVmBqvpv+ukzK/SzGCl5P5LyPBTCbNbfX+oIvkbePX9Z63OW3VucDf914+5wTj914+ZwZjUd0D9B3ya/gN2pv+AXXkHZIbfhw5S++81GxnSdgTOSu2/ZzZyJO4InJH8DkgOO0JH+o8RdoSudCBH7Add6T+O2A8604H3qzRPu0Fn+u9e1WZqN+iu+44n5a820+67AZ13PO0Z0vIc6bwb8Evnb+C0/Gl5jnTdC3jSf/tlGdV1L+C/Ou55Wva0PCM67gW86rjnadnT8ozouBfwquM3cFrutDwjuu0EfKVb/yVmTsx0pNNOwDuddj0xc2KmI512At7psuuJeRMzjeiyEzCiw54nZk7MNEL/sZMOe56YOTHTCP3Hjirvd2L2xEwj9B/UknY20/L8hP6DOhLPZWKmUSP9V/G5oKPEM5mYaZT+gzrSzmRanhn6D2pIO5NpeWboP6gh7Uym5Zmh/9hZlT1PzJmY6af0Hzuqtu9p+dLyzNJ/7KbivqflS8szS/+xm4o7n5YtLc+skV2o/ozwVHHf03Kl5Tmj4j7ArIr7npYrLc9Z1fYBZum/ayRlOavaPsCsav2XmKmbajsBs6rtemKmbqrtBJxRbc8TM3Wj/9iFPeeV/mM39psn38DArvQfsDP9B+zKOyCwK/0H7Ez/AbvyDgjsSv8BO9N/wK68AwK70n/AzvQfsCvvgMCu9B+wM/0H7Er/AbvSf8DOdB+wK/0H7E7vAQAAAAAAAAAAAACQ4l8iHjJS";
        },
        fp_getFriendList: function () {
            console.log("Return friend list");
            return debugConsole.fl;
        },
        fp_getFriendName: function (PID) {
            console.log("Get friend name of " + PID);
            return "David Joaq";
        },
        jumpToTitle: function (TID, bool) {
            console.log("Jump to app " + TID);
        },
        checkTitleExist: function (TID) {
            console.log("TID " + TID + " does exist.");
            return true;
        },
        jumpToMiiverse: function (bool) {
            console.log("Jump to Miiverse is " + bool);
        },
        jumpToMiiversePostId: function (postid, bool) {
            console.log("Jump to post " + postid + " on Miiverse is " + bool);
        },
        jumpToEShop: function (TID, bool) {
            console.log("Jump to eShop page of TID " + TID + " is " + bool);
        },
        jumpToVod: function (url, TID, bool) {
            console.log(
                "Jump to VOD app of TID " +
                TID +
                " with URL " +
                url +
                " is " +
                bool
            );
            window.location.href = url;
        },
        jumpToBrowser: function (url, bool) {
            console.log((bool ? "Jump" : "Did not jump") + " to URL " + url);
            window.location.href = url;
        },
        jumpToSettingsTvRemote: function (bool) {
            console.log(
                (bool ? "Jump" : "Did not jump") + " to TV Remote Settings"
            );
        },
        olv_isEnabled: function () {
            console.log("Miiverse is enabled");
            return true;
        },
        olv_getPostingResult: function () {
            console.log("Post was successful");
            return 1;
        },
        olv_getHostName: function () {
            console.log("Miiverse host name " + "https://api.olv.pretendo.cc");
            return "https://api.olv.pretendo.cc";
        },
        olv_getUserAgent: function () {
            console.log("Miiverse user agent " + "WiiU/POLV-5.0.3/353");
            return "WiiU/POLV-5.0.3/305";
        },
        olv_getServiceToken: function () {
            console.log("Return service token");
            return "token";
        },
        olv_getParameterPack: function () {
            console.log("Return param pack");
            return "XHRpdGxlX2lkXDE0MDc1ODEzMTA0OTcwMzRcYWNjZXNzX2tleVwzNDczXHBsYXRmb3JtX2lkXDFc cmVnaW9uX2lkXDJcbGFuZ3VhZ2VfaWRcMVxjb3VudHJ5X2lkXDQ5XGFyZWFfaWRcMzZcbmV0d29y a19yZXN0cmljdGlvblwwXGZyaWVuZF9yZXN0cmljdGlvblwwXHJhdGluZ19yZXN0cmljdGlvblwx N1xyYXRpbmdfb3JnYW5pemF0aW9uXDFcdHJhbnNmZXJhYmxlX2lkXDExMDU5OTY0MDc3OTU4MjI1 MzQ3XHR6X25hbWVcQW1lcmljYS9OZXdfWW9ya1x1dGNfb2Zmc2V0XC0xNDQwMFw=";
        },
        olv_postText: function (
            body,
            topicTag,
            feelingID,
            spoiler,
            searchkey1,
            searchkey2,
            searchkey3,
            searchkey4,
            searchkey5
        ) {
            console.log(
                "Post to Miiverse with message " +
                '"' +
                body +
                '"' +
                " with topic " +
                topicTag +
                " with feeling ID " +
                feelingID +
                " with spoilers " +
                spoiler +
                " with search key " +
                searchkey1 +
                " with search key " +
                searchkey2 +
                " with search key " +
                searchkey3 +
                " with search key " +
                searchkey4 +
                " with search key " +
                searchkey5
            );
        },
        olv_postTextFixedPhrase: function (
            body,
            topicTag,
            feelingID,
            spoiler,
            searchkey1,
            searchkey2,
            searchkey3,
            searchkey4,
            searchkey5
        ) {
            console.log(
                "Post to Miiverse fixed phrase with message " +
                '"' +
                body +
                '"' +
                " with topic " +
                topicTag +
                " with feeling ID " +
                feelingID +
                " with spoilers " +
                spoiler +
                " with search key " +
                searchkey1 +
                " with search key " +
                searchkey2 +
                " with search key " +
                searchkey3 +
                " with search key " +
                searchkey4 +
                " with search key " +
                searchkey5
            );
        },
        olv_postImage: function (
            painting,
            topicTag,
            feelingID,
            spoiler,
            searchkey1,
            searchkey2,
            searchkey3,
            searchkey4,
            searchkey5
        ) {
            console.log(
                "Post to Miiverse with drawing " +
                '"' +
                painting +
                '"' +
                " with topic " +
                topicTag +
                " with feeling ID " +
                feelingID +
                " with spoilers " +
                spoiler +
                " with search key " +
                searchkey1 +
                " with search key " +
                searchkey2 +
                " with search key " +
                searchkey3 +
                " with search key " +
                searchkey4 +
                " with search key " +
                searchkey5
            );
        },
        olv_postImageFixedPhrase: function (
            painting,
            topicTag,
            feelingID,
            spoiler,
            searchkey1,
            searchkey2,
            searchkey3,
            searchkey4,
            searchkey5
        ) {
            console.log(
                "Post to Miiverse fixed phrase with drawing " +
                '"' +
                painting +
                '"' +
                " with topic " +
                topicTag +
                " with feeling ID " +
                feelingID +
                " with spoilers " +
                spoiler +
                " with search key " +
                searchkey1 +
                " with search key " +
                searchkey2 +
                " with search key " +
                searchkey3 +
                " with search key " +
                searchkey4 +
                " with search key " +
                searchkey5
            );
        },
        suggest_isOpening: function () { return false },
        suggest_set: function (
            sug1,
            sug2,
            sug3,
            sug4,
            sug5,
            sug6,
            sug7,
            sug8,
            sug9,
            sug10
        ) {
            console.log(
                "Set suggestion strings " +
                '"' +
                sug1 +
                '", ' +
                '"' +
                sug2 +
                '", ' +
                '"' +
                sug3 +
                '", ' +
                '"' +
                sug4 +
                '", ' +
                '"' +
                sug5 +
                '", ' +
                '"' +
                sug6 +
                '", ' +
                '"' +
                sug7 +
                '", ' +
                '"' +
                sug8 +
                '", ' +
                '"' +
                sug9 +
                '", ' +
                '"' +
                sug10 +
                '"'
            );
            return true;
        },
        suggest_reset: function () {
            console.log("Reset suggestion strings");
            return true;
        },
        suggest_getString: function () { return "" },
        pc_checkPIN: function () {
            console.log("PIN is true, perentl conrol allowed");
            return true;
        },
        pc_runPINInput: function () {
            console.log("PIN is correcto, perentl conrol allowed");
            return 1;
        },
        pc_isControlled: function () {
            console.log("Parental Controls are disabled");
            return false;
        },
        pc_getMiiverseControlLevel: function () {
            console.log("No Miiverse Control Settings");
            return 0;
        },
        pc_isControlledNetworkCommunication: function () {
            console.log("No Network Communication Settings");
            return false;
        },
        pc_isControlledFriendReg: function () {
            console.log("No Friend Settings");
            return false;
        },
        pc_isControlledBrowser: function () {
            console.log("No Browser Settings");
            return false;
        },
        ng_checkText: function (message) {
            console.log(message + " does not contain any blacklisted words.");
            return true;
        },
        ng_checkWord: function (message) {
            console.log(message + " is not a blacklisted word.");
            return true;
        },
    };
}
