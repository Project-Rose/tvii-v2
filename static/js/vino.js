
/* eslint-disable */
(function ($) {
    $.fn.makeScrollContainer = function (isHorizontal) {
        return this.each(function () {
            var $el = $(this);

            // Store state per element
            var state = {
                scrCont: $el,
                isHorizontal: isHorizontal,
                isMouseDown: false,
                startPosX: 0,
                startPosY: 0,
                scrollStartX: 0,
                scrollStartY: 0,
                lastScrollPosX: 0,
                lastScrollPosY: 0,
                scrollVelocityX: 0,
                scrollVelocityY: 0,
                friction: 0.9,
                inertiaInterval: null,
                hasStartedScrolling: false,
                stop: function () {
                    clearInterval(state.inertiaInterval);
                    state.scrollVelocityX = 0;
                    state.scrollVelocityY = 0;
                }
            };

            // Save reference for later access
            $el.data("makeScrollContainer", state);

            // mousedown
            $el.on("mousedown.makeScrollContainer", function (e) {
                state.isMouseDown = true;
                state.startPosX = e.pageX;
                state.startPosY = e.pageY;
                state.scrollStartX = $el.scrollLeft();
                state.scrollStartY = $el.scrollTop();
                state.lastScrollPosX = state.scrollStartX;
                state.lastScrollPosY = state.scrollStartY;
                state.scrollVelocityX = 0;
                state.scrollVelocityY = 0;
                $el.css("cursor", "grabbing");
                clearInterval(state.inertiaInterval);
            });

            // mouseup (on document)
            $(document).on("mouseup.makeScrollContainer", function () {
                if (state.isMouseDown) {
                    state.isMouseDown = false;
                    $el.css("cursor", "grab");
                    state.hasStartedScrolling = false;

                    state.inertiaInterval = setInterval(function () {
                        var continueX = Math.abs(state.scrollVelocityX) > 0.1;
                        var continueY = Math.abs(state.scrollVelocityY) > 0.1;

                        if (continueX || continueY) {
                            if (continueX) {
                                $el.scrollLeft($el.scrollLeft() + state.scrollVelocityX);
                                state.scrollVelocityX *= state.friction;
                            }
                            if (continueY) {
                                $el.scrollTop($el.scrollTop() + state.scrollVelocityY);
                                state.scrollVelocityY *= state.friction;
                            }
                            $el.trigger("scrolling", {
                                scrollX: $el.scrollLeft(),
                                scrollY: $el.scrollTop()
                            });
                        } else {
                            clearInterval(state.inertiaInterval);
                        }
                    }, 20);
                }
            });

            // mousemove
            $el.on("mousemove.makeScrollContainer", function (e) {
                if (state.isMouseDown) {
                    if (!state.hasStartedScrolling) {
                        state.hasStartedScrolling = true;
                        // $el.trigger("scrollStart", { ... });
                    }

                    var currentPosX = e.pageX;
                    var currentPosY = e.pageY;
                    var walkX, walkY;

                    if (state.isHorizontal === 4) {
                        var deltaX = Math.abs(currentPosX - state.startPosX);
                        var deltaY = Math.abs(currentPosY - state.startPosY);

                        if (deltaX > deltaY) {
                            walkX = (currentPosX - state.startPosX) * 2;
                            $el.scrollLeft(state.scrollStartX - walkX);
                            state.scrollVelocityX = $el.scrollLeft() - state.lastScrollPosX;
                            state.lastScrollPosX = $el.scrollLeft();
                            state.scrollVelocityY = 0;
                        } else {
                            walkY = (currentPosY - state.startPosY) * 2;
                            $el.scrollTop(state.scrollStartY - walkY);
                            state.scrollVelocityY = $el.scrollTop() - state.lastScrollPosY;
                            state.lastScrollPosY = $el.scrollTop();
                            state.scrollVelocityX = 0;
                        }
                    } else {
                        walkX = (currentPosX - state.startPosX) * 2;
                        walkY = (currentPosY - state.startPosY) * 2;

                        if (state.isHorizontal === true || state.isHorizontal === 3) {
                            $el.scrollLeft(state.scrollStartX - walkX);
                            state.scrollVelocityX = $el.scrollLeft() - state.lastScrollPosX;
                            state.lastScrollPosX = $el.scrollLeft();
                        }
                        if (state.isHorizontal === false || state.isHorizontal === 3) {
                            $el.scrollTop(state.scrollStartY - walkY);
                            state.scrollVelocityY = $el.scrollTop() - state.lastScrollPosY;
                            state.lastScrollPosY = $el.scrollTop();
                        }
                    }

                    $el.trigger("scrolling", {
                        scrollX: $el.scrollLeft(),
                        scrollY: $el.scrollTop()
                    });
                }
            });
        });
    };
})(jQuery);

var tvii = {
    clientUrl: location.origin,
    BGMId: null,
    userSlot: vino.act_getCurrentSlotNo(),
    locFile: null,
    templates: {
        setUpLocHTML: function () {

            $("body")
                .find("[data-loc]")
                .each(function (index, el) {
                    var $el = $(el);

                    if ($.trim($el.html()).length) return;

                    var els = tvii.getLoc($el.attr("data-loc"));
                    $el.html(els);
                });

            $("body")
                .find("[data-loc-attr]")
                .each(function (index, el) {
                    var $el = $(el);

                    var raw = $el.attr("data-loc-attr");
                    if (!raw) return;

                    var a = JSON.parse(raw);

                    for (var key in a) {
                        if ($el.attr(key)) continue;

                        var value = a[key];
                        $el.attr(key, tvii.getLoc(value));
                    }
                });
        }
    },
    posts: {
        getMiiverseParPackProp: function (key) {
            var param = vino.olv_getParameterPack();
            var decodedParam = Base64.decode(param);
            decodedParam = decodedParam.substring(1, decodedParam.length - 1);
            var parts = decodedParam.split("\\").map(function (item) {
                return item.trim();
            });

            var keyValuePairs = [];
            for (var i = 0; i < parts.length; i += 2) {
                keyValuePairs.push({ key: parts[i], value: parts[i + 1] });
            }

            for (var i = 0; i < keyValuePairs.length; i++) {
                if (keyValuePairs[i].key === key) {
                    return keyValuePairs[i].value;
                }
            }
            return null;
        },
        appendMiiverseHeadersToXhr: function (xhr) {
            if (!vino.olv_isEnabled()) return;
            xhr.setRequestHeader(
                "X-Nintendo-Olv-Api-Url",
                vino.olv_getHostName()
            );
            xhr.setRequestHeader(
                "X-Nintendo-ServiceToken",
                vino.olv_getServiceToken()
            );
            xhr.setRequestHeader(
                "X-Nintendo-ParamPack",
                vino.olv_getParameterPack()
            );
            xhr.setRequestHeader(
                "X-Nintendo-Olv-User-Agent",
                vino.olv_getUserAgent()
            );
        },
        //Replacement to tvii.olv
        requestPosts: function (
            limit,
            lastPostId,
            searchKeys,
            callbackSuccess,
            callbackError
        ) {
            // Build query string manually
            var query = "limit=" + encodeURIComponent(limit);
            for (var i = 0; i < searchKeys.length; i++) {
                query += "&search_key=" + encodeURIComponent(searchKeys[i]);
            }

            if (lastPostId) {
                query += "&lastPostId=" + lastPostId;
            }

            return tvii.sendXHR("GET", "/api/v1/socials/postsAlt?" + query,
                function (text) {
                    callbackSuccess(JSON.parse(text))
                }, callbackError
            )
        },
        sendPostToApi: function (
            type,
            content,
            topicTag,
            appData,
            feeling,
            isAutopost,
            isSpoiler,
            searchKey1,
            searchKey2,
            searchKey3,
            searchKey4,
            searchKey5,
            attachment,
            onPostSendFinish
        ) {
            var postForm = new FormData();

            if (searchKey1 && searchKey1.length) {
                postForm.append("search_key", searchKey1);
            }
            if (searchKey2 && searchKey2.length) {
                postForm.append("search_key", searchKey2);
            }
            if (searchKey3 && searchKey3.length) {
                postForm.append("search_key", searchKey3);
            }
            if (searchKey4 && searchKey4.length) {
                postForm.append("search_key", searchKey4);
            }
            if (searchKey5 && searchKey5.length) {
                postForm.append("search_key", searchKey5);
            }

            if (topicTag && topicTag.length) {
                postForm.append("topic_tag", topicTag);
            }

            if (attachment && attachment.length) {
                postForm.append("screenshot", attachment);
            }

            postForm.append(type === "text" ? "body" : "painting", content);

            postForm.append("is_spoiler", isSpoiler ? "1" : "0");

            postForm.append("feeling_id", feeling ? String(feeling) : "0");

            //For miiverse crosspost
            /*postForm.append(
                "olv_language_id",
                tvii.posts.getMiiverseParPackProp("language_id")
                    ? tvii.posts.getMiiverseParPackProp("language_id")
                    : "1"
            );*/

            var url = "/api/v1/socials/postsAlt";
            //For miiverse crosspost
            //tvii.posts.appendMiiverseHeadersToXhr();

            var xhr = tvii.sendXHR("POST", url, null, null, null, postForm)
            xhr.onload = function () {
                onPostSendFinish(
                    xhr.status === 200,
                    xhr.responseText
                );
            }
            return xhr;
        },
        addEmpathyToPost: function (remove, id, onEmpathyFinish) {
            var url =
                "/api/v1/socials/postsAlt/" +
                id +
                "/empathies";
            var method = remove ? "DELETE" : "POST";

            var xhr = tvii.sendXHR(method, url);
            xhr.onload = function () {
                onEmpathyFinish(
                    xhr.status === 200,
                    xhr.responseText
                );
            }
            return xhr;
        },
    },
    getLoc: function (locID) {
        var localizedString =
            tvii.locFile && tvii.locFile[locID] != null
                ? tvii.locFile[locID]
                : locID;

        for (var i = 1; i < arguments.length; i++) {
            localizedString = localizedString.replace("%s", arguments[i]);
        }

        return localizedString;
    },
    setClassHoverToEls: function (els) {
        var self = this; // save reference to tvii

        if (!self._hoverBound) {
            // Shared handlers, only created once
            self._hoverAdd = function () {
                var $el = $(this);
                if (!$el.hasClass("hover") && !$el.hasClass("disabled")) {
                    $el.addClass("hover");
                    vino.soundPlayVolume("SE_COMMON_TOUCH_ON", 30);
                }
            };

            self._hoverRemove = function (playCancel) {
                var $el = $(this);
                if ($el.hasClass("hover")) {
                    $el.removeClass("hover");
                    if (playCancel) {
                        vino.soundPlayVolume("SE_COMMON_TOUCH_CANCEL", 30);
                    }
                }
            };

            self._hoverBound = true;
        }

        els.each(function () {
            if (!$.data(this, "2")) {
                var $el = $(this);

                $el.on("mousedown", self._hoverAdd);
                $el.on("mouseup", function () { self._hoverRemove.call(this, false); });
                $el.on("mouseleave", function () { self._hoverRemove.call(this, true); });

                $.data(this, "2", true);
            }
        });
    },
    setActualClickListener: function ($elements, onRealClick) {
        var dragThreshold = 5;

        $elements.each(function () {
            var $el = $(this);

            // Remove any previously set handlers to avoid duplicates
            $el.off(".actualClick");

            $el.on("mousedown.actualClick", function (e) {
                $el.data("D", false);
                $el.data("X", e.pageX);
                $el.data("Y", e.pageY);
            });

            $el.on("mousemove.actualClick", function (e) {
                var startX = $el.data("X") || 0;
                var startY = $el.data("Y") || 0;

                if (
                    Math.abs(e.pageX - startX) > dragThreshold ||
                    Math.abs(e.pageY - startY) > dragThreshold
                ) {
                    $el.data("D", true);
                }
            });

            $el.on("click.actualClick", function (e) {
                if ($el.data("D")) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                }
                onRealClick.call(this, e);
            });
        });
    },
    getLang: function () {
        //THIS JS IS FOR USA TVII, DOES NOT HANDLE LOCALES
        //HERE, WE ASSUME FR = CANADIAN FRENCH
        //EN = ENGLISH USA
        //ES = SPANISH 419

        return $("body").attr("data-lang");
    },
    getQuery: function (param, isSearch) {
        var queryString;

        if (isSearch) {
            queryString = window.location.search.substring(1);
        } else {
            queryString = param;
            param = param.split("?")[1];
        }

        var params = queryString.split("&");

        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split("=");
            if (pair[0] === param) {
                return decodeURIComponent(pair[1]);
            }
        }

        return null;
    },
    pushStateWithQuery: function (queryName, queryValue, isPush, pushData) {
        var queryString = location.search;
        var currentQuery = tvii.getQuery(queryName, true);

        if (currentQuery == null) {
            queryString += queryString
                ? "&" +
                encodeURIComponent(queryName) +
                "=" +
                encodeURIComponent(queryValue)
                : "?" +
                encodeURIComponent(queryName) +
                "=" +
                encodeURIComponent(queryValue);
        } else {
            var regex = new RegExp(
                "([?&])" + encodeURIComponent(queryName) + "=.*?(&|$)",
                "i"
            );
            queryString = queryString.replace(
                regex,
                "$1" +
                encodeURIComponent(queryName) +
                "=" +
                encodeURIComponent(queryValue) +
                "$2"
            );
        }

        const stateData = pushData || { __internal__: true };

        if (isPush) {
            window.history.pushState(
                stateData,
                "",
                tvii.clientUrl + window.location.pathname + queryString
            );
        } else {
            window.history.replaceState(
                stateData,
                "",
                tvii.clientUrl + window.location.pathname + queryString
            );
        }
    },
    clearWrapper: function () {
        $(".wrapper").empty();
    },
    replaceWrapper: function (html) {
        $(".wrapper").html(html);
    },
    getWrapper: function () {
        return $(".wrapper").html();
    },
    confirm: function (string, button1, button2) {
        return !vino.runTwoButtonDialog(
            string,
            button1 ? button1 : null,
            button2 ? button2 : null
        );
    },
    alert: function (dialog, button) {
        return vino.runSingleButtonDialog(dialog, button ? button : null);
    },
    showWrapper: function (show) {
        if (show) {
            $(".wrapper").removeClass("none");
        } else {
            $(".wrapper").addClass("none");
        }
    },
    clearEvents: function () {
        $(document).off("mousedown");
        $(document).off("mousemove");
        $(document).off("mouseup");
        $(document).off("scroll");
        $(document).off("click");
        $(window).off("click");
        $(window).off("scroll");
        $(window).off("mousemove");
        $(window).off("mousedown");
        $(".container").off("mousedown");
        $(".container").off("mousemove");
        $(".container").off("mouseup");
        clearInterval(window.infoUpdInterval);
        clearInterval(window.clockInterval);
        clearTimeout(window.clockTimeout);
    },
    setButtonActions: function () {
        function escapeForClassSelector(str) {
            return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
        }

        window.addEventListener(
            "focus",
            function (e) {
                var el = e.target;
                var rectStr = vino.navi_getRect();
                if (!el || !rectStr) return;

                // Parse rect from Wii U API
                var parts = rectStr.split(",");
                if (parts.length < 4) return;
                var naviRect = {
                    top: parseInt(parts[1], 10),
                    left: parseInt(parts[0], 10),
                    width: parseInt(parts[2], 10),
                    height: parseInt(parts[3], 10)
                };
                naviRect.right = naviRect.left + naviRect.width;
                naviRect.bottom = naviRect.top + naviRect.height;

                // Parent rect
                var parent = $(".l-stick-scroll:not(.scroll-disabled):visible").first();
                if (!parent.length) return;
                var rawParent = parent.get(0);
                var parentRect = rawParent.getBoundingClientRect();

                // --- Vertical scrolling ---
                if (naviRect.top < parentRect.top) {
                    // Scroll so the focus box aligns with top
                    rawParent.scrollTop -= (parentRect.top - naviRect.top);
                } else if (naviRect.bottom > parentRect.bottom) {
                    if (naviRect.height > parentRect.height) {
                        // Element taller than viewport → align top
                        rawParent.scrollTop += (naviRect.top - parentRect.top);
                    } else {
                        // Normal case → align bottom
                        rawParent.scrollTop += (naviRect.bottom - parentRect.bottom);
                    }
                }

                // --- Horizontal scrolling ---
                if (naviRect.left < parentRect.left) {
                    // Scroll so the focus box aligns with left
                    rawParent.scrollLeft -= (parentRect.left - naviRect.left);
                } else if (naviRect.right > parentRect.right) {
                    if (naviRect.width > parentRect.width) {
                        // Element wider than viewport → align left
                        rawParent.scrollLeft += (naviRect.left - parentRect.left);
                    } else {
                        // Normal case → align right
                        rawParent.scrollLeft += (naviRect.right - parentRect.right);
                    }
                }

                // Fire inertia-style scroll event
                parent.trigger("scrolling", {
                    scrollX: rawParent.scrollLeft,
                    scrollY: rawParent.scrollTop
                });
            },
            true
        );

        var maxSpeed = 40;
        var deadZone = 0.05;

        var inputCheck = setInterval(function () {
            wiiu.gamepad.update();

            var dx = wiiu.gamepad.lStickX;
            var dy = wiiu.gamepad.lStickY;

            if ((dx !== 0 && dy !== 0) || wiiu.gamepad.tpTouch === 1) {
                vino.navi_reset();
            }

            // Find the first visible scroll container
            var c = $(".l-stick-scroll:not(.scroll-disabled):visible").first();
            if (!c.length) return;

            // Check dead zone
            var movedX = Math.abs(dx) > deadZone;
            var movedY = Math.abs(dy) > deadZone;

            if (movedX || movedY) {
                // If container has inertia active, stop it before stick scroll
                var state = c.data("makeScrollContainer");
                if (state && state.inertiaInterval) {
                    state.stop(); // stop inertia properly
                }

                // Apply stick scroll
                if (movedX) {
                    c.scrollLeft(c.scrollLeft() + dx * maxSpeed);
                }
                if (movedY) {
                    c.scrollTop(c.scrollTop() - dy * maxSpeed); // invert Y
                }

                // Trigger same scrolling event as inertia
                c.trigger("scrolling", {
                    scrollX: c.scrollLeft(),
                    scrollY: c.scrollTop()
                });
            }
        }, 16); // ~60fps

        document.onkeydown = function (evt) {
            var kc;
            if (evt) {
                kc = evt.keyCode;
            } else {
                kc = event.keyCode;
            }

            switch (kc) {
                case 36:
                    //HBM
                    //vino.requestGarbageCollect();
                    break;
                default:
                    break;
            }

            var chr = String.fromCharCode(kc).toLowerCase();
            var safeChr = escapeForClassSelector(chr).trim();

            if (!safeChr || !safeChr.length) return;

            // 1. try visible elements first
            var els = $(".accesskey-" + safeChr + ":visible");

            // 2. if none, fallback to hidden elements
            if (!els.length) {
                els = $(".hidden-" + safeChr);
            }

            if (els.length) {
                var highestZ = -Infinity;
                var highestEl = null;

                els.each(function () {
                    var z = parseInt($(this).css("z-index"), 10);
                    if (isNaN(z)) z = 0; // treat "auto" as 0
                    if (z > highestZ) {
                        highestZ = z;
                        highestEl = $(this);
                    }
                });

                if (highestEl) {
                    if (highestEl.is("input, textarea, select")) {
                        highestEl.focus();
                        vino.wakeKeyboard();
                    } else {
                        highestEl.trigger("click");
                    }
                }
            }

        };
    },
    sendXHR: function (
        type,
        url,
        callbackSuccess,
        callbackError,
        headers,
        formData
    ) {

        var xhr = new XMLHttpRequest();
        xhr.open(type, url);
        xhr.timeout = 15000;

        if (headers) {
            for (var i = 0; i < headers.length; i++) {
                var headerParts = headers[i].split(":");
                var headerName = headerParts[0].trim();
                var headerValue = headerParts[1].trim();
                xhr.setRequestHeader(headerName, headerValue);
            }
        }

        xhr.ontimeout = function () {
            if (callbackError) {
                callbackError(xhr);
            }
            xhr = null;
        };

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if (callbackSuccess) {
                        callbackSuccess(
                            xhr.responseText || "",
                            xhr
                        );
                    }
                } else {
                    if (callbackError) {
                        callbackError(xhr);
                    }
                }
                xhr = null;
            }
        };

        if (type === "POST" && formData) {
            xhr.send(formData);
        } else {
            xhr.send();
        }
        return xhr;
    },
    sendXHRNoTimeout: function (
        type,
        url,
        callbackSuccess,
        callbackError,
        headers,
        formData
    ) {

        var xhr = new XMLHttpRequest();
        xhr.open(type, url);
        //xhr.timeout = 15000;

        if (headers) {
            for (var i = 0; i < headers.length; i++) {
                var headerParts = headers[i].split(":");
                var headerName = headerParts[0].trim();
                var headerValue = headerParts[1].trim();
                xhr.setRequestHeader(headerName, headerValue);
            }
        }

        xhr.ontimeout = function () {
            if (callbackError) {
                callbackError(xhr);
            }
            xhr = null;
        };

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if (callbackSuccess) {
                        callbackSuccess(
                            xhr.responseText || "",
                            xhr
                        );
                    }
                } else {
                    if (callbackError) {
                        callbackError(xhr);
                    }
                }
                xhr = null;
            }
        };

        if (type === "POST" && formData) {
            xhr.send(formData);
        } else {
            xhr.send();
        }
        return xhr;
    },
    requestProgramGuide: function (
        timestamp,
        timezone,
        lineup,
        duration,
        limit,
        offset,
        callbackSuccess,
        callbackFailure
    ) {
        return tvii.sendXHRNoTimeout("GET", "/api/v1/providers/lineup/" +
            tvii.getCountry() +
            "/" +
            lineup +
            "?start=" +
            String(timestamp) +
            "&tz_name=" +
            String(timezone) +
            "&duration=" +
            String(duration) +
            "&limit=" +
            String(limit) +
            "&offset=" +
            String(offset), function (data) {
                callbackSuccess(JSON.parse(data));
            }, callbackFailure)
    },
    requestProgramDetails: function (
        id,
        channelNum,
        scheduleDate,
        callbackSuccess,
        callbackFailure
    ) {
        return tvii.sendXHRNoTimeout(
            "GET",
            "/api/v1/providers/info" +
            "?listingId=" + id +
            "&channelNum=" + channelNum +
            "&date=" + scheduleDate +
            "&country=" + tvii.getCountry() +
            "&tz_name=" + tvii.getTVProviderTZ() +
            "&provider_id=" + tvii.getTVProviderID(),
            function (responseText) {
                var details = JSON.parse(responseText).data;
                callbackSuccess(details);
            },
            callbackFailure
        );
    },
    getUtcOffset: function () {
        return parseInt($("body").attr("data-utc-offset"));
    },
    getTVProviderTZ: function () {
        return $("body").attr("data-tv-provider-tz");
    },
    getTVProviderID: function () {
        return $("body").attr("data-tv-provider-id");
    },
    getServerPID: function () {
        return parseInt($("body").attr("data-pid"));
    },
    getLockedHourTimestamp: function () {
        var offsetSeconds = tvii.getUtcOffset(); // e.g. -18000
        var offsetMillis = offsetSeconds * 1000;

        // 1. True UTC now
        var nowUtcMillis = Date.now();

        // 2. Shift into custom timezone
        var localMillis = nowUtcMillis + offsetMillis;
        var d = new Date(localMillis);

        // 3. Round in THAT timezone
        var minutes = d.getUTCMinutes();
        if (minutes < 30) {
            d.setUTCMinutes(0, 0, 0);
        } else {
            d.setUTCMinutes(30, 0, 0);
        }

        // 4. Format as "YYYY-MM-DD HH:mm:ss"
        function pad(n) {
            return n < 10 ? "0" + n : "" + n;
        }

        var year = d.getUTCFullYear();
        var month = pad(d.getUTCMonth() + 1);
        var day = pad(d.getUTCDate());
        var hour = pad(d.getUTCHours());
        var minute = pad(d.getUTCMinutes());
        var second = "00";

        return year + "-" + month + "-" + day +
            " " + hour + ":" + minute + ":" + second;
    },
    parseLocalDateTime: function (str) {
        // "2026-01-25T21:00:00"
        var parts = str.split(/[-T:]/);

        return Date.UTC(
            parts[0] | 0,        // year
            (parts[1] | 0) - 1,  // month (0-based)
            parts[2] | 0,        // day
            parts[3] | 0,        // hour
            parts[4] | 0,        // minute
            parts[5] | 0         // second
        ) / 1000; // seconds (to match your existing logic)
    },
    getDateWithOffset: function () {
        var now = new Date();
        var utc = now.getTime() + now.getTimezoneOffset() * 60000; // always gives real UTC
        return new Date(utc + tvii.getUtcOffset() * 1000); // offset from UTC
    },
    setUpPageTip: function () {
        var span = document.querySelector(
            ".program-list .content .tips span:nth-of-type(2)"
        );
        if (!span) return;

        var tipIndex = Math.floor(Math.random() * 12) + 1; // 1 to 12
        var key = "vino.home.tips.tip" + tipIndex;
        var tipText = tvii.getLoc(key);

        span.innerHTML = tipText;
    },
    getRegion: function () {
        return $("body").attr("data-region");
    },
    getCountry: function () {
        return $("body").attr("data-country");
    },
    getProgramGenre: function (genreID, rating) {
        // normalize inputs
        genreID = genreID || "";
        rating = rating ? rating : null;

        // --- Animated special rule ---
        if (genreID === "A") {
            console.log(rating)
            if (rating == "TV14" || rating == "TVMA") {
                return "adult_animated";
            }
            return "family";
        }

        // --- Movies ---
        if (genreID === "M" || genreID === "." || genreID === "/" || genreID === "0") {
            return "movies";
        }

        // --- Sports ---
        if (genreID === "O") {
            return "sports";
        }

        // --- News ---
        if (
            genreID === "Y" ||
            genreID === "2" ||
            genreID === "3" ||
            genreID === "9" ||
            genreID === "ï" ||
            genreID === "æ"
        ) {
            return "news";
        }

        // --- Family & Kids ---
        if (
            genreID === "I" ||
            genreID === "~" ||
            genreID === "î" ||
            genreID === "ì" ||
            genreID === "â"
        ) {
            return "family";
        }

        // --- Series & Drama ---
        if (
            genreID === "N" ||
            genreID === "1" ||
            genreID === "E" ||
            genreID === "?" ||
            genreID === "ë" ||
            genreID === "Q" ||
            genreID === "R"
        ) {
            return "series";
        }

        // --- Comedy ---
        if (genreID === "6") {
            return "comedy";
        }

        // --- Reality & Game Shows ---
        if (
            genreID === "*" ||
            genreID === "G" ||
            genreID === "7" ||
            genreID === "," ||
            genreID === "%"
        ) {
            return "reality";
        }

        // --- Documentary & Factual ---
        if (
            genreID === "D" ||
            genreID === "é" ||
            genreID === "+" ||
            genreID === "ü" ||
            genreID === "!" ||
            genreID === "^" ||
            genreID === "ÿ" ||
            genreID === "<" ||
            genreID === "P"
        ) {
            return "documentary";
        }

        // --- Lifestyle & How-To ---
        if (
            genreID === "H" ||
            genreID === "F" ||
            genreID === "5" ||
            genreID === "4" ||
            genreID === "L" ||
            genreID === "=" ||
            genreID === "K" ||
            genreID === "J" ||
            genreID === "ò" ||
            genreID === "ô"
        ) {
            return "lifestyle";
        }

        // --- Music & Arts ---
        if (
            genreID === "W" ||
            genreID === "X" ||
            genreID === "Ñ"
        ) {
            return "music";
        }

        // --- Talk & Business ---
        if (
            genreID === "T" ||
            genreID === "8" ||
            genreID === "B" ||
            genreID === "ç" ||
            genreID === "C" ||
            genreID === ":"
        ) {
            return "talk";
        }

        // --- Fallback ---
        return "special";
    },
    downloadTitleImage: function () {
        var url = window.location.origin + "/api/v1/title?lang=" + tvii.getLang();

        // key to store last download time
        var LS_KEY = "title_image_last_download";

        // current time
        var now = Date.now();

        // get stored timestamp
        var lastDownload = parseInt(vino.ls_getItem(LS_KEY), 10);

        // 1 hour in ms
        var ONE_HOUR = 60 * 60 * 1000;

        // if downloaded less than 1 hour ago → skip
        if (lastDownload && (now - lastDownload < ONE_HOUR)) {
            return;
        }

        // if no image OR expired → download again
        if (!vino.title_hasImage(LS_KEY) || (now - lastDownload >= ONE_HOUR)) {
            vino.title_clearImage();

            vino.title_setFixedImage(
                url,
                LS_KEY,
                "",
                "",
                "",
                2
            );

            // save new timestamp
            vino.ls_setItem(LS_KEY, now.toString());
        }
    },
    initialize: function () {
        //Avoids black memo issue
        tvii.downloadTitleImage();
        vino.memo_reset();

        if (vino.ir_isEnabled()) {
            //User has set-top box?
            if (vino.ir_existsOtherCodeset()) {
                vino.ir_enableCodeset(2);
            }
            //User has TV remote only set up
            else if (vino.ir_existsTvCodeset()) {
                vino.ir_enableCodeset(1);
            }
        }

        vino.loading_setIconRect(360, 160, 120, 120);
        vino.navi_setMoveMethod(0);
        vino.video_enableOnTV(true);

        tvii.setButtonActions();
        checkCurrentPage();

        function checkCurrentPage() {
            var path = window.location.pathname.split("/").pop().split("?")[0].split("#")[0];
            if (path === "index.html") {
                // we're on index.html (or root treated as index.html)
                initVinoHome();
            }
            if (path === "setup.html") {
                // only init setup if we're actually on setup.html
                initVinoSetup();
            }
        }

    },
};

function initVinoSetup() {
    tvii.templates.setUpLocHTML();
    tvii.BGMId = vino.soundPlayVolume("SE_APP_START_SUB", 20);

    var savedCode;
    var savedProviderId;
    var BAfterLogInReturnTimeout;
    var setupCont = $(".setup-modal-container").makeScrollContainer(false);

    var country = tvii.getCountry();

    var isUS = country === "US";
    var isCA = country === "CA";

    var usZipCodeInput = $(".zipcode-input .zip-usa");
    var caZipCodeInput = $(".zipcode-input .zip-canada");

    var miiImg = $("#setup-modal-6 .mii img");
    var bModal = $("#bsky-login");

    if (!isUS && !isCA) {
        tvii.alert(tvii.getLoc("vino.error.not_supported_error"));
        vino.exitForce();
    }

    $("a, input").on("click", function (e) {
        if ($(this).hasClass("disabled")) return;
        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
        }
    });

    $("a.btn-1:not(.black)").on("click", function () {
        if ($(this).hasClass("disabled")) return;
        vino.soundPlayVolume("SE_CLOSE", 30);
    });

    $("a.btn-2, .social-buttons a").on("click", function () {
        if ($(this).hasClass("disabled")) return;
        vino.soundPlayVolume("SE_DECIDE", 30);
    });

    var miiData = encodeURIComponent(vino.act_getMiiData(tvii.userSlot));

    var baseUrl =
        tvii.clientUrl +
        "/api/v1/miis.png?texResolution=128&width=128&data=" +
        miiData;
    var smileUrl =
        tvii.clientUrl +
        "/api/v1/miis.png?texResolution=128&width=128&expression=smile&data=" +
        miiData;

    var noMii = "/img/noMii.png";
    // Preload both
    //GC will free them from memory...
    var preload1 = new Image();
    preload1.src = baseUrl;

    var preload2 = new Image();
    preload2.src = smileUrl;

    var preload3 = new Image();
    preload3.src = noMii;

    miiImg.attr("src", preload1.src);

    miiImg.on("error", function () {
        $(this).attr("src", preload3.src);
        miiImg.off("error");
    });

    $("#setup-modal-1 .btn-1.black").on("click", function () {
        vino.soundPlayVolume("SE_COMMON_FINISH", 30);
        vino.exit();
    });

    bModal.find(".submit-login").on("click", logInBsky);
    bModal.find(".submit-logout").on("click", logOutBsky);
    $(".btn-2.account-creation").on("click", createAccount);

    function changeSetupModal(show, hide) {
        if (hide) {
            hide.addClass("none");
        }
        show.removeClass("none");
        setupCont.scrollTop(0);

        if (show.attr("id") === "bsky-login") {
            console.log();
        } else if (show.attr("id") === "setup-modal-5") {
            clearTimeout(BAfterLogInReturnTimeout);
        }
    }

    var accountCreating = false;

    function createAccount() {
        if (accountCreating) return;
        accountCreating = true;
        //Not supposed to be able to trigger this func without having selected a provider.
        var providerSelA = $(".tvproviders").find(
            ".selected[data-provider-id]"
        ).first();
        var tvProviderId = providerSelA.attr("data-provider-id");
        var tvProviderTz = providerSelA.attr("data-provider-tz");

        //Checks to avoid problems....
        if (!tvProviderId || !tvProviderId.length) {
            accountCreating = false;
            return alert(tvii.getLoc("vino.setup.error.no_provider_id"));
        } else if (!tvProviderTz || !tvProviderTz.length) {
            accountCreating = false;
            return alert(tvii.getLoc("vino.setup.error.no_provider_tz"));
        }

        var form = new FormData();

        form.append("bskyUsernameTemp", bModal.attr("data-bsky-username"));
        form.append("bskyPasswordTemp", bModal.attr("data-bsky-password"));
        form.append("tv_provider_id", tvProviderId);
        form.append("tv_provider_tz", tvProviderTz);

        var favoriteChannels = [];
        var favEls = $(".channel-container a.fav");

        for (var i = 0; i < favEls.length; i++) {
            var id = favEls.eq(i).attr("data-channel-full-id");
            if (id) {
                favoriteChannels.push(id);
            }
        }

        form.append("favorite_channels", JSON.stringify(favoriteChannels));

        tvii.sendXHR(
            "POST",
            "/api/v1/act/createAccount",
            function () {
                miiImg.attr("src", preload2.src);
                vino.soundStop(tvii.BGMId);
                tvii.BGMId = null;
                accountCreating = false;
                window.location.replace("index.html");
            },
            function (request) {
                var status = request.responseText ? request.responseText : null;
                if (status) {
                    status = JSON.parse(status).status;
                    if (status === "error_not_pretendo") {
                        handleError(true);
                    } else {
                        handleError(false);
                    }
                } else {
                    handleError(false);
                }

                function handleError(isPretendoError) {
                    if (isPretendoError) {
                        tvii.alert(
                            tvii.getLoc("vino.error.account_not_pretendo")
                        );
                    } else {
                        tvii.alert(
                            tvii.getLoc(
                                "vino.error.account_creation_unavailable"
                            )
                        );
                    }
                }

                setTimeout(function () {
                    accountCreating = false;
                }, 0);
            },
            null,
            form
        );
    }

    var isBskyRequesting = false;

    function logInBsky() {
        if (isBskyRequesting) return;
        //Actually only checks if the account is valid.
        //Session tokens are created when submitting the account creation.
        var username = bModal.find(".username").val();
        var password = bModal.find(".password").val();

        if (username.length < 1 || password.length < 1) {
            tvii.alert(tvii.getLoc("vino.setup.bsky-login.p9"));
            return;
        }

        isBskyRequesting = true;
        vino.loading_setIconAppear(true);

        var request = new XMLHttpRequest();
        request.timeout = 15000;

        var form = new FormData();
        form.append("username", username);
        form.append("password", password);

        request.open("POST", "/api/v1/socials/BSLoginCheck");
        request.onerror = function () {
            vino.loading_setIconAppear(false);
            isBskyRequesting = false;
        };

        request.ontimeout = function () {
            vino.loading_setIconAppear(false);
            isBskyRequesting = false;
        };

        request.onload = function () {
            vino.loading_setIconAppear(false);

            if (request.status === 200) {
                var res = JSON.parse(request.responseText);
                if (!res.active) {
                    tvii.alert(tvii.getLoc("vino.setup.bsky-login.p8"));
                    return;
                }
                bModal.attr("data-bsky-logged-in", "true");
                bModal.attr("data-bsky-username", username);
                bModal.attr("data-bsky-password", password);

                bModal.find("input").addClass("none");
                bModal.find(".submit-login").addClass("none");
                bModal.find(".submit-logout").removeClass("none");
                bModal.find("p:not(.logged-in)").addClass("none");
                bModal.find(".logged-in").removeClass("none");
                bModal.find(".display-name").text(res.displayName);
                bModal.find(".username").text("@" + res.handle);

                BAfterLogInReturnTimeout = setTimeout(function () {
                    changeSetupModal($("#setup-modal-5"), bModal);
                    isBskyRequesting = false;
                }, 1200);
            } else {
                tvii.alert(tvii.getLoc("vino.setup.bsky-login.p6"));
                isBskyRequesting = false;
            }
        };
        request.send(form);
    }

    function logOutBsky() {
        if (
            tvii.confirm(
                tvii.getLoc("vino.setup.bsky-login.p7"),
                tvii.getLoc("vino.cancel"),
                tvii.getLoc("vino.logout")
            )
        ) {
            bModal.attr("data-bsky-logged-in", "false");
            bModal.attr("data-bsky-username", "");
            bModal.attr("data-bsky-password", "");

            bModal.find("input").removeClass("none");
            bModal.find("input").val("");
            bModal.find("p:not(.logged-in)").removeClass("none");
            bModal.find(".logged-in").addClass("none");
            bModal.find(".display-name").text("");
            bModal.find(".username").text("");
            bModal.find(".submit-login").removeClass("none");
            bModal.find(".submit-logout").addClass("none");

            changeSetupModal($("#setup-modal-5"), bModal);
        }
    }

    function setUpProviderAnchors(providers) {
        for (var i = 0; i < providers.data.length; i++) {
            var provider = providers.data[i];
            var providerA = $("<a>");
            providerA.addClass("none");
            providerA.attr("data-provider-id", provider.lineup_id);
            providerA.attr("data-provider-tz", provider.tz_name);
            providerA.attr("navi_target", "");
            providerA.attr("navi_no_reset", "");
            providerA.attr("tabindex", "0");
            providerA.attr("data-provider-type", provider.type === "other" ? "cable" : provider.type);

            var normalizedType;

            if (provider.type.indexOf("cable") !== -1) {
                normalizedType = tvii.getLoc("vino.setup.tvtypes.cable");
            } else if (provider.type.indexOf("other") !== -1) {
                normalizedType = tvii.getLoc("vino.setup.tvtypes.iptv");
            } else if (provider.type.indexOf("antenna") !== -1) {
                normalizedType = tvii.getLoc("vino.setup.tvtypes.antenna");
            } else if (provider.type.indexOf("satellite") !== -1) {
                normalizedType = tvii.getLoc("vino.setup.tvtypes.satellite");
            }

            var providerN = $("<p>");
            providerN.html(provider.name);

            var providerC = $("<span>");
            providerC.html(normalizedType);

            providerA.append(providerN);
            providerA.append(providerC);

            $(".tvproviders").append(providerA);
        }

        $(".tvproviders .providertypes>a").removeClass("selected");
        $(".tvproviders .providertypes>a:first-child").addClass("selected");

        tvii.setActualClickListener($(".tvproviders>a"), function (evt) {
            var t = $(this);
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
                // get position relative to document
                var offset = t.offset();

                var left = offset.left;
                var top = offset.top;
                var width = t.outerWidth();
                var height = t.outerHeight();

                // call effect with coords
                vino.lyt_startTouchNodeEffect(left, top, width, height);
            }
            vino.soundPlayVolume("SE_CHECK", 30);
            $(".tvproviders>a").removeClass("selected");
            t.addClass("selected");
        });

        $(".tvproviders>a").addClass("none");
        $('.tvproviders>a[data-provider-type="cable"]').removeClass("none");

        $('.tvproviders>a[data-provider-type="cable"]')
            .last()
            .addClass("last");
        $('.tvproviders>a[data-provider-type="antenna"]')
            .last()
            .addClass("last");
        $('.tvproviders>a[data-provider-type="satellite"]')
            .last()
            .addClass("last");

        $(".tvproviders").removeClass("none");
    }

    function checkZipCodeProviders() {
        var code = isCA ? caZipCodeInput.val() : usZipCodeInput.val();

        if ($(".tvproviders>a").length && savedCode === code) {
            return;
        } else {
            $(".tvproviders>a").remove();
        }

        vino.loading_setIconAppear(true);

        $(".tvproviders").addClass("none");
        savedCode = code;
        var endpoint = isCA ? "/api/v1/providers/countries/CA/" + code : "/api/v1/providers/countries/US/" + code

        tvii.sendXHRNoTimeout(
            "GET",
            endpoint,
            function (responseText) {
                var providers = JSON.parse(responseText);
                setUpProviderAnchors(providers);
                vino.loading_setIconAppear(false);
            },
            function () {
                vino.loading_setIconAppear(false);
                $(".tvproviders").addClass("none");
                tvii.alert(
                    tvii.getLoc("vino.setup.screen3.m1"),
                    tvii.getLoc("vino.setup.screen3.m1.b1")
                );
                changeSetupModal($("#setup-modal-2"), $("#setup-modal-3"));
            }
        );

    }

    $(".help-button").on("click", function () {
        vino.soundPlayVolume("SE_HELP", 30);
        alert(tvii.getLoc("vino.setup.help." + $(this).attr("data-help")))
    })

    $(".channel-search-container .chnumber").on("change", function () {
        var text = $(this).val();

        var results = getChannelArrayByQuery(text, 2);
        setUpFavoriteCandidates(results, true);

        var $container = $(".channel-container");

        var $match = $container
            .find("[data-channel-number]")
            .filter(function () {
                return $(this).attr("data-channel-number") == text;
            })
            .first();

        scrollContainerToElement($(".setup-modal-container"), $match);
    });

    $(".channel-search-container .chname").on("change", function () {
        var text = $(this).val();

        var results = getChannelArrayByQuery(text, 1);
        setUpFavoriteCandidates(results, true);

        var $container = $(".channel-container");

        var $match = $container
            .find("[data-channel-full-name]")
            .filter(function () {
                return $(this).attr("data-channel-full-name") === text;
            })
            .first();

        scrollContainerToElement($(".setup-modal-container"), $match);
    });

    function scrollContainerToElement($container, $el) {
        if (!$el.length) return;

        var containerTop = $container.scrollTop();
        var containerOffset = $container.offset().top;
        var elementOffset = $el.offset().top;

        // position of element inside container
        var scrollTo = containerTop + (elementOffset - containerOffset);

        $container.stop(true).animate({
            scrollTop: scrollTo
        }, 200);
    }


    var cacheCandidates = null;

    function setUpFavoriteCandidates(candidates, addMoreMode) {
        if (!addMoreMode) {
            cacheCandidates = candidates.data;
        }
        var imageQueue = [];
        var maxChanAtOnce = 30;
        var max = Math.min(candidates.data.length, maxChanAtOnce);

        for (var i = 0; i < max; i++) {
            var option = candidates.data[i];
            if ($('.channel-container [data-channel-number="' + option.number + '"]').length) {
                continue; // skip duplicate
            }
            var optionA = $("<a>");
            optionA.attr("data-channel-id", option.station);
            optionA.attr("navi_target", "");
            optionA.attr("navi_no_reset", "");
            optionA.attr("tabindex", "0");
            optionA.attr("data-channel-full-name", option.name);
            optionA.attr("data-channel-full-id", option.id);
            optionA.attr("data-channel-number", option.number);

            var optionI = $("<img>");
            // set placeholder FIRST
            optionI.attr("src", "/img/channel-favorite-none.png");

            // queue real image src
            if (option.logo) {
                imageQueue.push({
                    img: optionI,
                    src: "/images/cdn/tvp/" + option.logo + "?width=90"
                });
            }

            var optionN = $("<p>");
            optionN.html(option.name);

            var optionC = $("<p>");
            var optionC2 = $("<span>");
            var optionC3 = $("<span>");
            optionC2.html(option.number);
            optionC3.html(option.callsign);

            optionC.append(optionC2);
            optionC.append(optionC3);

            optionA.append(optionI);
            optionA.append(optionN);
            optionA.append(optionC);

            $(".channel-container").append(optionA);
        }

        tvii.setActualClickListener($(".channel-container>a"), function () {
            var t = $(this);
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
                // get position relative to document
                var offset = t.offset();

                var left = offset.left;
                var top = offset.top;
                var width = t.outerWidth();
                var height = t.outerHeight();

                // call effect with coords
                vino.lyt_startTouchNodeEffect(left, top, width, height);
            }

            vino.soundPlayVolume("SE_CHECK", 30);

            if (t.hasClass("fav")) {
                t.removeClass("fav");
                t.prev().removeClass("favprev");
            } else {
                t.addClass("fav");
                t.prev().addClass("favprev");
            }
        });

        var idx = 0;
        function loadNextImage() {
            if (idx >= imageQueue.length) return;

            imageQueue[idx].img.attr("src", imageQueue[idx].src);
            idx++;

            setTimeout(loadNextImage, 256); // ← throttle here
        }

        loadNextImage();
    }

    //Suggest keyboard for the favorite channels !!!!!!!!

    var suggest_string = "";

    function scoreMatch(text, query) {
        text = text.toLowerCase();
        query = query.toLowerCase();

        if (text.indexOf(query) === 0) return 100; // starts with
        if (text.indexOf(query) !== -1) return 50; // contains

        return 0;
    }

    //for autocomplete
    function getChannelSuggestions(query) {
        if (!query) {
            return [];
        }

        var results = [];

        for (var i = 0; i < cacheCandidates.length; i++) {
            var channel = cacheCandidates[i];
            if (!channel.name) continue;

            var score = scoreMatch(channel.name, query);

            if (score > 0) {
                results.push({
                    name: channel.name,
                    score: score
                });
            }
        }

        // best matches first
        results.sort(function (a, b) {
            return b.score - a.score;
        });

        // return only names (max 10)
        var names = [];
        for (var i = 0; i < results.length && i < 10; i++) {
            names.push(results[i].name);
        }

        return names;
    }

    // for actual input change
    function getChannelArrayByQuery(query, type) {
        if (!query) {
            return { data: [] };
        }

        var results = [];

        for (var i = 0; i < cacheCandidates.length; i++) {
            var channel = cacheCandidates[i];

            if (type === 1) {
                if (!channel.name) continue;
            } else {
                if (!channel.number) continue;
            }

            var score;
            if (type === 1) {
                score = scoreMatch(channel.name, query);
            } else {
                score = scoreMatch(channel.number, query);
            }

            if (score > 0) {
                results.push({
                    channel: channel,
                    score: score
                });
            }
        }

        // best matches first
        results.sort(function (a, b) {
            return b.score - a.score;
        });

        return {
            data: results.map(function (r) {
                return r.channel;
            })
        };
    }

    setInterval(function () {
        if (vino.suggest_isOpening()) {
            var new_string = vino.suggest_getString();

            if (new_string == "") {
                vino.suggest_reset();
            }

            if (new_string !== suggest_string) {
                suggest_string = new_string;

                var matches = getChannelSuggestions(new_string);

                // always send exactly 10 params
                var args = [];
                for (var i = 0; i < 10; i++) {
                    args.push(matches[i] || null);
                }

                vino.suggest_set(
                    args[0],
                    args[1],
                    args[2],
                    args[3],
                    args[4],
                    args[5],
                    args[6],
                    args[7],
                    args[8],
                    args[9]
                );
            }
        } else {
            suggest_string = "";
        }
    }, 100);


    function requestChannelsToFavorite() {
        var providerId = $(".tvproviders>a.selected").attr("data-provider-id")
        var providerTz = $(".tvproviders>a.selected").attr("data-provider-tz")
        if ($(".channel-container>a").length && savedProviderId == providerId) {
            return;
        } else {
            $(".channel-container>a").remove();
        }

        $(".channel-search-container .chname").val("");
        $(".channel-search-container .chnumber").val("");

        vino.loading_setIconAppear(true);

        savedProviderId = providerId;

        var endpoint = "/api/v1/providers/countries/" + (isCA ? "CA" : "US") + "/" + providerId + "/channels?tz_name=" + providerTz;

        tvii.sendXHRNoTimeout(
            "GET",
            endpoint,
            function (responseText) {
                var channel_list = JSON.parse(responseText);
                setUpFavoriteCandidates(channel_list, false);
                vino.loading_setIconAppear(false);
            },
            function () {
                vino.loading_setIconAppear(false);
                changeSetupModal($("#setup-modal-3"), $("#setup-modal-4"));
            }
        );
    }

    $("a[data-show][data-hide]").on("click", function () {
        var a = $(this);
        changeSetupModal($(a.attr("data-show")), $(a.attr("data-hide")));
    });

    //Check if its US or Canada
    if (isUS) {
        usZipCodeInput.removeClass("none");
    } else if (isCA) {
        caZipCodeInput.removeClass("none");
    }
    $(".provider-info").removeClass("none");

    changeSetupModal($("#setup-modal-1"), null);

    usZipCodeInput.on("input change", onZipCodeUpdate);
    caZipCodeInput.on("input change", onZipCodeUpdate);

    function onZipCodeUpdate() {
        var minLength = isCA ? 3 : 5;
        var maxLength = isCA ? 7 : 5;
        var length = $(this).val().length;
        if (length >= minLength && length <= maxLength) {
            $(".zipcode-checkconfirm").removeClass("disabled");
        } else {
            $(".zipcode-checkconfirm").addClass("disabled");
        }
    }

    $(".zipcode-checkconfirm").on("click", function () {
        if ($(this).hasClass("disabled")) {
            return;
        }
        changeSetupModal($("#setup-modal-3"), $("#setup-modal-2"));

        checkZipCodeProviders();
    });

    $(".provider-checkconfirm").on("click", function () {
        if ($(".tvproviders>a.selected").length) {
            changeSetupModal($("#setup-modal-4"), $("#setup-modal-3"));
            requestChannelsToFavorite();
        } else {
            tvii.alert(tvii.getLoc("vino.setup.screen3.p2"));
        }
    });

    $(".tvproviders .providertypes>a").on("click", function () {
        vino.soundPlayVolume("SE_TAB_SELECT", 30);

        $(".tvproviders .providertypes>a").removeClass("selected");
        $(this).addClass("selected");

        $(".tvproviders>a").addClass("none");
        $(
            '.tvproviders>a[data-provider-type="' +
            $(this).attr("data-provider-filter") +
            '"]'
        ).removeClass("none");
    });
}

function initVinoHome() {
    tvii.templates.setUpLocHTML();

    window.addEventListener("popstate", function (e) {
        var query = tvii.getQuery("scene", true);
        console.log("popstate" + query);
        switch (query) {
            case "pprev":
                onProgramPreviewPopstate(e);
                break;
            case "livetab":
                onLiveTabPopstate(e);
                break;
            case "guidetab":
                onGuideTabPopstate(e);
                break;
            default:
                break;
        }
    });

    /*if (tvii.getQuery("scene", true)) {
        tvii.pushStateWithQuery("scene", "livetab", false);
    } else {
        tvii.pushStateWithQuery("scene", "livetab", false);
    }*/

    setupClock();
    tvii.setClassHoverToEls(
        $(
            ".exit, .menu, .back, .tune-in, .miiverse-button, .miiverse-post"
        )
    );

    $(".header .exit").on("click", function (e) {
        if (isHeaderButtonBlocked) return;
        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
            vino.soundPlayVolume("SE_COMMON_FINISH_TOUCH_OFF", 30);
        } else {
            vino.soundPlayVolume("SE_COMMON_FINISH", 30);
        }
        vino.exit();
    });

    $(".footer .back").on("click", function (e) {
        if (isHeaderButtonBlocked) return;
        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
            vino.soundPlayVolume("SE_CLOSE_TOUCH_OFF", 30);
        } else {
            vino.soundPlayVolume("SE_CLOSE", 30);
        }
        history.back();
    });

    var isSendingIR = false;

    $(".tune-in").on("click", function (e) {
        if (isHeaderButtonBlocked) return;
        if (isSendingIR) return;

        var chNum = $(".program-details").attr("data-chnum");
        if (!chNum) return;

        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
        }

        isSendingIR = true;

        chNum = chNum.trim();

        var digits = chNum.split("");
        var index = 0;

        function sendNextDigit() {
            if (index >= digits.length) {
                // After digits, send OK (code 60)
                vino.ir_send(60, 0);

                // Play remote finish sound
                setTimeout(function () {
                    vino.soundPlayVolume("SE_REMOTE_FINISH", 30);
                    isSendingIR = false;
                }, 550);
                return;
            }

            var digit = digits[index++];
            var code = 0;

            switch (digit) {
                case "0":
                    code = 20;
                    break;
                case "1":
                    code = 11;
                    break;
                case "2":
                    code = 12;
                    break;
                case "3":
                    code = 13;
                    break;
                case "4":
                    code = 14;
                    break;
                case "5":
                    code = 15;
                    break;
                case "6":
                    code = 16;
                    break;
                case "7":
                    code = 17;
                    break;
                case "8":
                    code = 18;
                    break;
                case "9":
                    code = 19;
                    break;
                case ".":
                case "-":
                    code = 55;
                    break;
                default:
                    setTimeout(sendNextDigit, 550); // Skip invalid
                    return;
            }

            vino.ir_send(code, 0);
            setTimeout(sendNextDigit, 550);
        }

        sendNextDigit();
    });

    $(".header .menu").on("click", function (e) {
        e.preventDefault();
        alert(tvii.getLoc("vino.home.not_available_feature"));
    })

    $(".header .tabs>a").on("click", function () {
        if (isHeaderButtonBlocked) return;
        if ($(this).hasClass("selected")) return;

        if ($(this).index() === 0) {
            vino.lyt_startTouchEffect();
            vino.soundPlayVolume("SE_TAB_SELECT", 30);
            initLiveTab();
        }
        return alert(tvii.getLoc("vino.home.not_available_feature"));

        $(".header .tabs>a").removeClass("selected");
        $(this).addClass("selected");
        switch ($(this).index()) {
            case 0: // first child
                initLiveTab();
                break;
            case 1: // second child
                initGuideTab();
                break;
            case 2: // third child
                initRecommendedTab();
                break;
        }
    });

    var requested = false;
    var programListScroll = 0;
    var programPreviewScroll = 0;
    var lineup = tvii.getTVProviderID();
    var lineup_tz = tvii.getTVProviderTZ();
    var limit = 40;
    var offset = 0;
    var total = 0;
    var duration = 120;

    var currentSnappedElement = null;

    function setUpTitleScrollbar(onSnapCallback, onConfirmCallback) {
        var container = document.querySelector(".program-list .content");
        var thumb = document.querySelector(".program-list .scrollbar .thumb");

        var minThumbTop = 22;
        var maxThumbTop = 225;
        var snapAnchorY = 193.5;

        var lastScrollTop = container.scrollTop;
        var scrollSoundThreshold = 4;
        var isSnappingBack = false;
        var scrollEndSfx = "SE_LIST_SCROLL_END";
        var scrollSfx = scrollEndSfx.slice(0, -4);
        var vol = 60;

        // Edge lockout vars
        var EDGE_RESET_PX = 4; // must move this far away from edge to re-arm beep
        var edgeLockTop = false;
        var edgeLockBottom = false;

        function updateThumbPosition() {
            var maxScroll = container.scrollHeight - container.clientHeight;
            if (maxScroll <= 0) return;
            var scrollRatio = container.scrollTop / maxScroll;
            var newTop =
                minThumbTop + scrollRatio * (maxThumbTop - minThumbTop);
            thumb.style.top = newTop + "px";
        }

        function updateContainerScroll(thumbTop) {
            var maxScroll = container.scrollHeight - container.clientHeight;
            if (maxScroll <= 0) return;
            var scrollRatio =
                (thumbTop - minThumbTop) / (maxThumbTop - minThumbTop);
            container.scrollTop = scrollRatio * maxScroll;
        }

        function playScrollSound() {
            if (isSnappingBack) {
                lastScrollTop = container.scrollTop;
                return;
            }

            const maxScroll = container.scrollHeight - container.clientHeight;
            const top = container.scrollTop;
            const delta = Math.abs(top - lastScrollTop);

            const nearTop = top <= 1;
            const nearBottom = top >= Math.max(0, maxScroll - 1);

            const awayFromTop = top > EDGE_RESET_PX;
            const awayFromBottom = top < maxScroll - EDGE_RESET_PX;

            // Entering top edge
            if (nearTop && !edgeLockTop) {
                vino.soundPlayVolume(scrollEndSfx, vol);
                edgeLockTop = true;
                edgeLockBottom = false; // clear opposite lock
            }
            // Entering bottom edge
            else if (nearBottom && !edgeLockBottom) {
                vino.soundPlayVolume(scrollEndSfx, vol);
                edgeLockBottom = true;
                edgeLockTop = false;
            }
            // Middle scrolling
            else if (!nearTop && !nearBottom && delta >= scrollSoundThreshold) {
                vino.soundPlayVolume(scrollSfx, vol);
            }

            // Unlock edges when far enough away
            if (edgeLockTop && awayFromTop) edgeLockTop = false;
            if (edgeLockBottom && awayFromBottom) edgeLockBottom = false;

            lastScrollTop = top;
        }

        function snapToElement(elem, triggerCallback) {
            if (!elem) return;
            var containerRectTop = container.getBoundingClientRect().top;
            var anchorY = containerRectTop + snapAnchorY;
            var rect = elem.getBoundingClientRect();
            var delta = rect.top + rect.height / 2 - anchorY;
            var targetScroll = container.scrollTop + delta;

            isSnappingBack = true;
            $(container)
                .stop(true)
                .animate({ scrollTop: targetScroll }, 140, function () {
                    currentSnappedElement = elem;
                    isSnappingBack = false;
                    if (
                        typeof onSnapCallback === "function" &&
                        triggerCallback
                    ) {
                        onSnapCallback(elem);
                    }
                });
        }

        snapToClosestProgram = function (triggerCallback) {
            var programs = container.querySelectorAll(".program");
            var len = programs.length;
            if (!len) return;

            var containerRectTop = container.getBoundingClientRect().top;
            var anchorY = containerRectTop + snapAnchorY;
            var closest = null;
            var closestDistance = Infinity;

            for (var i = 0; i < len; i++) {
                var rect = programs[i].getBoundingClientRect();
                var centerY = rect.top + rect.height / 2;
                var distance = Math.abs(centerY - anchorY);
                if (distance < closestDistance) {
                    closest = programs[i];
                    closestDistance = distance;
                }
            }

            if (!closest) return;
            snapToElement(closest, triggerCallback);
        };

        // Scrollbar dragging
        thumb.addEventListener("mousedown", function (e) {
            e.preventDefault();
            var startY = e.clientY;
            var startTop = parseFloat(thumb.style.top) || minThumbTop;

            function onMouseMove(e) {
                var deltaY = e.clientY - startY;
                var newTop = Math.max(
                    minThumbTop,
                    Math.min(maxThumbTop, startTop + deltaY)
                );
                thumb.style.top = newTop + "px";
                updateContainerScroll(newTop);
                playScrollSound();
            }

            function onMouseUp() {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                snapToClosestProgram(true);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        // Container drag scroll
        container.addEventListener("mousedown", function (e) {
            var startY = e.clientY;
            var startScroll = container.scrollTop;
            var isDragging = false;

            function onMouseMove(e) {
                var deltaY = e.clientY - startY;
                if (Math.abs(deltaY) > 1) isDragging = true;
                container.scrollTop = startScroll - deltaY;
                updateThumbPosition();
                playScrollSound();
            }

            function onMouseUp() {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                if (isDragging) snapToClosestProgram(true);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        // Sync thumb when scrolling
        container.addEventListener("scroll", updateThumbPosition);
        updateThumbPosition();
        lastScrollTop = container.scrollTop;

        // Click listener
        window.setListenerToProgram = function () {
            var $programs = $(".program");
            $programs.each(function () {
                var $el = $(this);
                //1 doesnt mean anything, its just to use less ram.
                if ($el.data("1")) return;
                $el.data("1", true);
                tvii.setActualClickListener($programs, function (evt) {
                    if (isSnappingBack) return;
                    if (
                        typeof onConfirmCallback === "function" &&
                        this === currentSnappedElement
                    ) {
                        onConfirmCallback(this, false);
                        return;
                    }
                    vino.lyt_startTouchEffect();
                    vino.soundPlayVolume(scrollSfx, vol);
                    snapToElement(this, true);
                });
            });
        };

        // Previous/Next controls
        var hiddenUp = document.querySelector(".title-program-up");
        var hiddenDown = document.querySelector(".title-program-down");
        var hiddenOk = document.querySelector(".title-program-confirm");

        if (hiddenUp) {
            hiddenUp.addEventListener("click", function () {
                if (isSnappingBack || !currentSnappedElement) return;
                var all = Array.prototype.slice.call(
                    container.querySelectorAll(".program")
                );
                var visible = all.filter(function (el) {
                    return el.offsetParent !== null;
                });
                var index = visible.indexOf(currentSnappedElement);
                if (index > 0) {
                    vino.soundPlayVolume(scrollSfx, vol);
                    snapToElement(visible[index - 1], true);
                }
            });
        }

        if (hiddenDown) {
            hiddenDown.addEventListener("click", function () {
                if (isSnappingBack || !currentSnappedElement) return;
                var all = Array.prototype.slice.call(
                    container.querySelectorAll(".program")
                );
                var visible = all.filter(function (el) {
                    return el.offsetParent !== null;
                });
                var index = visible.indexOf(currentSnappedElement);
                if (index >= 0 && index < visible.length - 1) {
                    vino.soundPlayVolume(scrollSfx, vol);
                    snapToElement(visible[index + 1], true);
                }
            });
        }

        if (hiddenOk) {
            hiddenOk.addEventListener("click", function () {
                if (isSnappingBack) return;
                if (currentSnappedElement) {
                    onConfirmCallback(currentSnappedElement, true);
                }
            });
        }
    }

    function setProgramDivAttribute(guide) {
        var result = guide.data;
        var programs = document.querySelectorAll(
            ".program-list .contents > .program"
        );

        // === Reset all program display styles ===
        for (var k = 0; k < programs.length; k++) {
            programs[k].style.display = "";
        }

        // === Apply data to visible programs ===
        for (var i = 0; i < programs.length && i < result.length; i++) {
            var item = result[i];
            var channel = item.channel;
            var programEl = programs[i];

            // === Clear contents ===
            programEl.querySelector(".station .num").textContent = "";
            programEl.querySelector(".station .nam").textContent = "";
            programEl.querySelector(".title").textContent = "";

            programEl.querySelector(".info .text").textContent = "";
            programEl.querySelector(".info .tag").textContent = "";

            var genreEl = programEl.querySelector(".genre");
            genreEl.classList.remove("talk");
            genreEl.classList.remove("news");
            genreEl.classList.remove("movies");
            genreEl.classList.remove("sports");
            genreEl.classList.remove("family");
            genreEl.classList.remove("series");
            genreEl.classList.remove("comedy");
            genreEl.classList.remove("reality");
            genreEl.classList.remove("documentary");
            genreEl.classList.remove("lifestyle");
            genreEl.classList.remove("music");
            genreEl.classList.remove("special");
            genreEl.classList.remove("adult_animated");

            genreEl.querySelector("span").innerHTML = "";

            // Set channel-related attributes
            programEl.setAttribute("data-chname", channel.name);
            programEl.setAttribute("data-chcsign", channel.callsign);
            programEl.setAttribute("data-chlogo", channel.logo);
            programEl.setAttribute("data-chnum", channel.number);
            programEl.setAttribute("data-chstat", channel.station);
            programEl.setAttribute("data-churl", channel.url);

            var schedules = item.programs;
            var max = schedules.length; // no more 3-limit

            // === Add / update attributes for all schedules ===
            for (var j = 0; j < max; j++) {
                var program = schedules[j];
                var index = j + 1;

                programEl.setAttribute("data-prlistid-" + index, program.listingId);
                programEl.setAttribute("data-prname-" + index, program.showName);
                programEl.setAttribute("data-prlive-" + index, program.isLive);
                programEl.setAttribute("data-prnew-" + index, program.isNew);
                programEl.setAttribute("data-prtype-" + index, program.showTypeID);
                programEl.setAttribute("data-prrating-" + index, program.rating);
                programEl.setAttribute("data-prstart-" + index, program.start);
                programEl.setAttribute("data-prend-" + index, program.end);
                programEl.setAttribute("data-prinfodate-" + index, program.scheduleDate);
            }

            // === Remove leftover attributes if fewer than previously set ===
            // (in case DOM had more schedules before)
            var attrIndex = max + 1;
            while (programEl.hasAttribute("data-prlistid-" + attrIndex)) {
                programEl.removeAttribute("data-prlistid-" + attrIndex);

                programEl.removeAttribute("data-prname-" + attrIndex);
                programEl.removeAttribute("data-prlive-" + attrIndex);
                programEl.removeAttribute("data-prnew-" + attrIndex);
                programEl.removeAttribute("data-prtype-" + attrIndex);
                programEl.removeAttribute("data-prrating-" + attrIndex);
                programEl.removeAttribute("data-prstart-" + attrIndex);
                programEl.removeAttribute("data-prend-" + attrIndex);
                programEl.removeAttribute("data-prinfodate-" + attrIndex);
                attrIndex++;
            }

            programEl.setAttribute("data-active-index", "");
        }

        // === Hide unused program divs ===
        for (var l = result.length; l < programs.length; l++) {
            programs[l].style.display = "none";
        }
    }

    function formatAMPMWithDate(utcStartSec, utcEndSec) {
        // Wrap UTC milliseconds directly
        var start = new Date(utcStartSec * 1000);
        var end = new Date(utcEndSec * 1000);

        var lang = tvii.getLang();

        // Day short names from localization file
        var dayKeys = [
            "vino.days.sun_short",
            "vino.days.mon_short",
            "vino.days.tue_short",
            "vino.days.wed_short",
            "vino.days.thu_short",
            "vino.days.fri_short",
            "vino.days.sat_short"
        ];

        // READ UTC VALUES AS-IS
        var dayName = tvii.getLoc(dayKeys[start.getUTCDay()]);
        var month = start.getUTCMonth() + 1;
        var day = start.getUTCDate();

        // English US time (12h)
        function formatUs(d) {
            var hours = d.getUTCHours();
            var minutes = d.getUTCMinutes();
            var ampm = hours >= 12 ? "pm" : "am";

            hours = hours % 12;
            if (hours === 0) hours = 12;

            return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ampm;
        }

        // 24-hour format
        function format24(d) {
            var h = d.getUTCHours();
            var m = d.getUTCMinutes();
            return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
        }

        // French "h" format
        function formatFr(d) {
            var h = d.getUTCHours();
            var m = d.getUTCMinutes();
            return (h < 10 ? "0" + h : h) + " h " + (m < 10 ? "0" + m : m);
        }

        // SPANISH: "Sáb. 1/11, 18:30 - 18:37"
        if (lang === "es") {
            return (
                dayName + ". " +
                day + "/" + month + ", " +
                format24(start) + " - " + format24(end)
            );
        }

        // FRENCH: "Sam. 1/11, 18 h 30 - 18 h 37"
        if (lang === "fr") {
            return (
                dayName + ". " +
                day + "/" + month + ", " +
                formatFr(start) + " - " + formatFr(end)
            );
        }

        // DEFAULT ENGLISH: "Sat. 11/1, 6:30pm - 6:37pm"
        return (
            dayName + ". " +
            month + "/" + day + ", " +
            formatUs(start) + " - " + formatUs(end)
        );
    }


    function setupClock() {
        var clock = document.querySelector(".bottom .clock");
        if (!clock) return;

        var dateSpan = clock.querySelector(".date");
        var daySpan = clock.querySelector(".day");
        var sepSpan = clock.querySelector(".sep");
        var hourSpan = clock.querySelector(".hour");
        var colonSpan = hourSpan.querySelector("span");

        var lang = tvii.getLang();

        // language rules
        var use24Hour = lang === "es" || lang === "fr";
        var useDayFirst = lang === "es" || lang === "fr";

        // hide AM/PM if 24h format
        if (sepSpan) {
            sepSpan.innerHTML = "H<br>R";
        }

        var days = [
            tvii.getLoc("vino.days.sun_short"),
            tvii.getLoc("vino.days.mon_short"),
            tvii.getLoc("vino.days.tue_short"),
            tvii.getLoc("vino.days.wed_short"),
            tvii.getLoc("vino.days.thu_short"),
            tvii.getLoc("vino.days.fri_short"),
            tvii.getLoc("vino.days.sat_short")
        ];

        function pad(n) {
            return n < 10 ? "0" + n : n;
        }

        function updateClock() {
            var nowUTC = new Date();
            var localMillis = nowUTC.getTime() + tvii.getUtcOffset() * 1000;
            var local = new Date(localMillis);

            var hours = local.getUTCHours();
            var minutes = local.getUTCMinutes();

            var displayHours;
            var isPM = hours >= 12;

            if (use24Hour) {
                displayHours = pad(hours);
            } else {
                var hours12 = hours % 12;
                if (hours12 === 0) hours12 = 12;

                displayHours = pad(hours12);

                if (sepSpan) {
                    sepSpan.textContent = isPM ? "PM" : "AM";
                }
            }

            // Update date and day
            var month = pad(local.getUTCMonth() + 1);
            var dayNum = pad(local.getUTCDate());
            var dayIndex = local.getUTCDay();
            var dayName = days[dayIndex];

            // ✅ locale date format
            if (useDayFirst) {
                dateSpan.textContent = dayNum + "/" + month; // DD/MM
            } else {
                dateSpan.textContent = month + "/" + dayNum; // MM/DD
            }

            daySpan.textContent = dayName;

            // Update hour + minute
            var minsText = pad(minutes);
            hourSpan.firstChild.nodeValue = displayHours;
            hourSpan.lastChild.nodeValue = minsText;

            // Toggle blinking colon
            colonSpan.style.visibility =
                colonSpan.style.visibility === "hidden" ? "visible" : "hidden";

            // Remove previous classes
            daySpan.classList.remove("sat");
            daySpan.classList.remove("sun");

            // Add day-specific class
            if (dayIndex === 6) {
                daySpan.classList.add("sat");
            } else if (dayIndex === 0) {
                daySpan.classList.add("sun");
            }
        }

        updateClock();

        var now = Date.now();
        var delay = 1000 - (now % 1000);

        window.clockTimeout = setTimeout(function () {
            updateClock();
            window.clockInterval = setInterval(updateClock, 1000);
        }, delay);
    }


    function setupProgramTimer() {
        window.infoUpdInterval = setInterval(function () {
            updateTabListProgram();
        }, 25 * 1000);
    }

    function abortReqsXhr() {
        if (progPrevReq) {
            console.warn("abort prog prev")
            progPrevReq.abort();
            progPrevReq = null;
        }
        if (postPrevReq) {
            console.warn("abort post prev")
            postPrevReq.abort();
            postPrevReq = null;
        }
    }

    var progPrevReq = null;

    function programPreviewUpdate(program) {
        var programDetails = $(".program-central .program-details");
        program = $(program);

        // === Get index of current active program ===
        var activeIndex = program.attr("data-active-index");
        if (!activeIndex) {
            console.log("No active index set for this program element.");
            return;
        }

        //listing id
        var programId = program.attr("data-prlistid-" + activeIndex);
        var programInfoDate = program.attr("data-prinfodate-" + activeIndex);
        var channelId = program.attr("data-churl");

        var channelNum = program.attr("data-chnum");

        // === Previously shown data ===
        var lastProgramId = programDetails.attr("data-prlistid");
        var lastChannelNum = programDetails.attr("data-chnum");

        if (
            lastProgramId === programId &&
            lastChannelNum === channelNum
        ) {
            console.log(lastChannelNum)
            console.log(channelNum)
            console.log("same num, and prog");
            return;
        }

        var chlogo = programDetails.find(".chlogo");
        chlogo.removeClass("no-icon");

        if (program.attr("data-chlogo") && program.attr("data-chlogo") != "null") {
            var logoSrc = "/images/cdn/tvp" + program.attr("data-chlogo");

            // Replace the part between "station/" and "/v2" with "60x34"
            logoSrc = logoSrc.replace(/(station\/)[^\/]+(\/v2)/, '$160x34$2');
        } else {
            logoSrc = "/img/no-ch-logo.png";
            chlogo.addClass("no-icon");
        }

        chlogo.off("error").on("error", function () {
            chlogo.hide();
        });

        if (progPrevReq) {
            console.warn("abort prog prev")
            progPrevReq.abort();
            progPrevReq = null;
        }

        // === Otherwise, fetch new program details ===
        programDetails.hide();
        programDetails.find(".program-airing-details").hide();
        programDetails.find(".program-airing-image").hide();
        vino.loading_setIconRect(165, 180, 110, 110);
        vino.loading_setIconAppear(true);
        chlogo.show();
        chlogo.attr("src", logoSrc);
        showMiiversePostPreview(false);

        progPrevReq = tvii.requestProgramDetails(
            programId,
            channelNum,
            programInfoDate,
            function (details) {
                var programListingID = details.program.listingId;
                var episodeID = details.program.showId;
                var channelNumber = details.channel.number;
                var programName = details.program.showName;
                var programEpisode = details.program.episodeTitle;


                var img = details.extra_program ? details.extra_program.image : null;

                var isValidImage =
                    img && img.indexOf("/resource/img/generics/") === -1;

                if (isValidImage) {
                    img = img.replace(/^.*?(\/image\/)/, "$1");
                    img = img.replace(/\/\d+x\d+\//, "/426x240/");
                } else if (details.program.showPicture) {
                    //if show picture exists, set isValidImage to true
                    isValidImage = true;
                    img = "/image/show/426x240/" + details.program.showPicture;
                }

                var canSetDetailInfo = !isValidImage || Math.random() < 0.8;

                if (canSetDetailInfo) {
                    var programDescription = details.program.description;
                    programDetails.find(".program-description > p").text(programDescription);

                    programDetails.find(".pname").text(programName);

                    var hasYear = details.program.year && details.program.year.length;
                    var hasShowType = details.program.showType && details.program.showType.length;
                    var hasTVRating = details.program.rating && details.program.rating.length;
                    var hasCC = details.program.isCC;
                    var programDuration = details.program.duration;

                    var parts = [];

                    if (hasYear) parts.push(details.program.year);
                    if (hasTVRating) parts.push(details.program.rating);
                    if (hasCC) parts.push("CC");
                    if (hasShowType) parts.push(details.program.showType);
                    parts.push(programDuration + "min")

                    var otherDetail = parts.join(" · ");

                    programDetails.find(".chnum").text(otherDetail);

                    var programStart = tvii.parseLocalDateTime(details.program.start);
                    var programEnd = tvii.parseLocalDateTime(details.program.end);

                    var timeStr = formatAMPMWithDate(programStart, programEnd);
                    programDetails.find(".date").text(timeStr);

                    if (programEpisode) {
                        programDetails.find(".channel-detail").removeClass("no-episode");
                        programDetails.find(".pepisode").text(programEpisode);
                    } else {
                        programDetails.find(".channel-detail").addClass("no-episode");
                        programDetails.find(".pepisode").text("");
                    }
                    programDetails.find(".program-airing-details").show();
                } else {
                    programDetails
                        .find(".program-airing-image > .img")
                        .css("background-image", "url(/images/cdn/tvp" + img + ")");
                    programDetails.find(".program-airing-image").show();
                }

                requestMiiversePostProgPreview(episodeID);
                programDetails.attr("data-prlistid", programListingID);
                programDetails.attr("data-chnum", channelNumber);
                programDetails.attr("data-prlist-date", programInfoDate);
                programDetails.attr("data-channel-id", channelId);

                vino.loading_setIconAppear(false);
                programDetails.show();
                progPrevReq = null;
            },
            function () {
                vino.loading_setIconAppear(false);
                // Optional error handler
                progPrevReq = null;
            }
        );
    }

    function showMiiversePostPreview(show) {
        $(".bottom .miiverse-preview").css("display", show ? "" : "none");
    }

    var isHeaderButtonBlocked = false;

    function disableTopBotHeaders(disable) {
        isHeaderButtonBlocked = disable;
        $(".footer a").css("pointer-events", disable ? "none" : "auto");
        $(".top a").css("pointer-events", disable ? "none" : "auto");
    }

    function getFeelingQueryFromPostXml(feeling) {
        var feelingQuery = "normal";
        switch (feeling) {
            case 1:
                feelingQuery = "smile_open_mouth";
                break;
            case 2:
                feelingQuery = "like_wink_left";
                break;
            case 3:
                feelingQuery = "surprise_open_mouth";
                break;
            case 4:
                feelingQuery = "frustrated";
                break;
            case 5:
                feelingQuery = "sorrow";
                break;
            default:
                break;
        }
        return feelingQuery;
    }

    function setMiiversePostProgPreview(postObj) {
        var miiversePrev = $(".bottom .miiverse-preview");
        const firstPost = postObj;
        if (!firstPost) {
            miiversePrev.find("span").addClass("placeholder");
            miiversePrev
                .find("span")
                .text(tvii.getLoc("vino.home.olv.preview_no_posts"));
            showMiiversePostPreview(true);
            return;
        }

        miiversePrev.find("span").removeClass("placeholder");
        var body = firstPost.body;
        var isSpoiler = firstPost.is_spoiler;

        if (isSpoiler) {
            miiversePrev.find("span").addClass("placeholder");
            body = tvii.getLoc("vino.home.olv.preview_spoiler");
        }

        if (!body || body.length < 1) {
            miiversePrev.find("span").addClass("placeholder");
            body = tvii.getLoc("vino.home.olv.preview_handwritten");
        }
        miiversePrev.find("span").text(body);

        var miiData = firstPost.mii_data;
        var feeling = firstPost.feeling_id;
        var feelingQ = getFeelingQueryFromPostXml(feeling);
        var miiUrl =
            "/api/v1/miis.png?width=75&expression=" +
            feelingQ +
            "&data=" +
            encodeURIComponent(miiData) +
            "&type=face";

        var img = new Image();
        img.onload = function () {
            miiversePrev.find("img").attr("src", miiUrl);
        };
        img.onerror = function () {
            miiversePrev
                .find("img")
                .attr("src", "/img/noMiiPost.png");
        };
        img.src = miiUrl;

        showMiiversePostPreview(true);
    }

    // Keep a global/current request id
    var currentMiiversePreviewReq = 0;
    var postPrevReq = null;

    function requestMiiversePostProgPreview(programId) {
        if (postPrevReq) {
            console.warn("abort post prev")
            postPrevReq.abort();
        }

        var miiversePrev = $(".bottom .miiverse-preview");
        showMiiversePostPreview(false);

        miiversePrev.find("span").text("");
        miiversePrev.find("img").attr("src", "/img/noMiiPost.png");

        // Increment request counter each time function is called
        var thisReq = ++currentMiiversePreviewReq;

        postPrevReq = tvii.posts.requestPosts(
            "1", null,
            ["PR" + programId],
            function (posts) {
                postPrevReq = null;
                // If this is not the latest request, ignore it
                if (thisReq !== currentMiiversePreviewReq) return;

                const firstPost = posts[0];
                if (!firstPost) {
                    miiversePrev.find("span").addClass("placeholder");
                    miiversePrev
                        .find("span")
                        .text(tvii.getLoc("vino.home.olv.preview_no_posts"));
                    showMiiversePostPreview(true);
                    return;
                }

                miiversePrev.find("span").removeClass("placeholder");
                var body = firstPost.body;
                var isSpoiler = firstPost.is_spoiler;

                if (isSpoiler) {
                    miiversePrev.find("span").addClass("placeholder");
                    body = tvii.getLoc("vino.home.olv.preview_spoiler");
                }

                if (!body || body.length < 1) {
                    miiversePrev.find("span").addClass("placeholder");
                    body = tvii.getLoc("vino.home.olv.preview_handwritten");
                }
                miiversePrev.find("span").text(body);

                var miiData = firstPost.mii_data;
                var feeling = firstPost.feeling_id;
                var feelingQ = getFeelingQueryFromPostXml(feeling);
                var miiUrl =
                    "/api/v1/miis.png?width=75&expression=" +
                    feelingQ +
                    "&data=" +
                    encodeURIComponent(miiData) +
                    "&type=face";

                var img = new Image();
                img.onload = function () {
                    // Only set image if this is still the latest request
                    if (thisReq === currentMiiversePreviewReq) {
                        miiversePrev.find("img").attr("src", miiUrl);
                    }
                };
                img.onerror = function () {
                    if (thisReq === currentMiiversePreviewReq) {
                        miiversePrev
                            .find("img")
                            .attr("src", "/img/noMiiPost.png");
                    }
                };
                img.src = miiUrl;

                showMiiversePostPreview(true);
            },
            function () {
                postPrevReq = null;
                if (thisReq === currentMiiversePreviewReq) {
                    showMiiversePostPreview(true);
                }
            }
        );
    }

    function drawLyt() {
        vino.lyt_drawFixedFrame(430, 214, 364, 81);
    }

    function updateTabListProgram() {
        var nowTimestamp = ((Date.now() / 1000) | 0) + tvii.getUtcOffset();

        $(".program-list .contents .program").each(function () {
            var $a = $(this);
            var dom = this;

            var program = null;
            var index = 1;

            while (true) {
                var startStr = $a.attr("data-prstart-" + index);
                var endStr = $a.attr("data-prend-" + index);

                if (!startStr || !endStr) break;

                var start = tvii.parseLocalDateTime(startStr);
                var end = tvii.parseLocalDateTime(endStr);

                if (nowTimestamp >= start && nowTimestamp < end) {
                    program = {
                        listingId: $a.attr("data-prlistid-" + index),
                        title: $a.attr("data-prname-" + index),
                        startTime: start,
                        endTime: end,
                        rating: $a.attr("data-prrating-" + index),
                        isNew: $a.attr("data-prnew-" + index) === "true",
                        isLive: $a.attr("data-prlive-" + index) === "true",
                        genre: $a.attr("data-prtype-" + index),
                        index: index
                    };
                    break;
                }

                index++;
            }

            if (!program) return;

            var activeIndex = parseInt($a.attr("data-active-index"), 10);
            if (activeIndex === program.index) {
                var elapsedSeconds = nowTimestamp - program.startTime;
                var infoSpan = dom.querySelector("span.info .text");
                if (infoSpan) {
                    infoSpan.textContent = computeLiveInfoText(elapsedSeconds);
                }
                return;
            }

            $a.attr("data-active-index", program.index);

            var titleSpan = dom.querySelector("span.title");
            if (titleSpan) titleSpan.textContent = program.title;

            var stationSpan = dom.querySelector("span.station");
            if (stationSpan) {
                var namSpan = stationSpan.querySelector(".nam");
                var numSpan = stationSpan.querySelector(".num");

                if (namSpan && !namSpan.textContent.trim()) {
                    var chName = $a.attr("data-chname") || "";
                    var chNum = $a.attr("data-chnum") || "";
                    namSpan.textContent = chName;
                    if (chNum) numSpan.textContent = chNum;
                }
            }

            var infoSpan2 = dom.querySelector("span.info");
            var tag = dom.querySelector("span.info > .tag");
            var txt = dom.querySelector("span.info > .text");

            var infoSpan2 = dom.querySelector("span.info");
            var tag = dom.querySelector("span.info > .tag");

            if (infoSpan2 && tag) {
                tag.className = "tag";

                if (program.isLive) {
                    tag.className += " tagl";
                    tag.textContent = tvii.getLoc("vino.home.lst.live");
                    tag.style.display = "";
                } else if (program.isNew) {
                    tag.className += " tagn";
                    tag.textContent = tvii.getLoc("vino.home.lst.new");
                    tag.style.display = "";
                } else {
                    tag.textContent = "";
                    tag.style.display = "none";
                }
            }

            var genreEl = $a.find(".genre");
            genreEl.removeClass("talk");
            genreEl.removeClass("news");
            genreEl.removeClass("movies");
            genreEl.removeClass("sports");
            genreEl.removeClass("family");
            genreEl.removeClass("series");
            genreEl.removeClass("comedy");
            genreEl.removeClass("reality");
            genreEl.removeClass("documentary");
            genreEl.removeClass("lifestyle");
            genreEl.removeClass("music");
            genreEl.removeClass("special");
            genreEl.removeClass("adult_animated");

            var genreIDText = tvii.getProgramGenre(program.genre, program.rating);

            genreEl.addClass(genreIDText);
            genreEl.find("span").html(tvii.getLoc("vino.home.genre." + genreIDText))

            if (txt) {
                txt.textContent = computeLiveInfoText(nowTimestamp - program.startTime);
            }

            function computeLiveInfoText(elapsedSeconds) {
                if (elapsedSeconds < 60)
                    return tvii.getLoc("vino.home.lst.time_moment_ago");

                var mins = (elapsedSeconds / 60) | 0;
                if (mins === 1)
                    return tvii.getLoc("vino.home.lst.time_minute_ago", 1);

                var hrs = (mins / 60) | 0;
                var rem = mins % 60;

                if (hrs > 0 && rem > 0)
                    return tvii.getLoc("vino.home.lst.time_hours_minutes_ago", hrs, rem);

                if (hrs > 0)
                    return tvii.getLoc("vino.home.lst.time_hours_ago", hrs);

                return tvii.getLoc("vino.home.lst.time_minutes_ago", mins);
            }
        });
    }


    function setContainerPagination() {
        $(".pagi-menu .prev, .pagi-menu .next").on("click", function () {
            if (isHeaderButtonBlocked) return;
            if (requested) return;

            var isPrev = $(this).hasClass("prev");
            var isNext = $(this).hasClass("next");

            if (isPrev && offset === 0) return;
            if (isNext && offset + limit >= total) return;

            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
            vino.soundPlayVolume("SE_PROGRAM_SLIDE_SPEED", 30);
            requested = true;
            $(this).addClass("selected");

            if (isPrev) {
                offset = Math.max(0, offset - limit);
            } else {
                offset = offset + limit;
            }

            requestGuidePage(isPrev, $(this));
        });

        function requestGuidePage(isPrev, $button) {
            disableTopBotHeaders(true);
            vino.lyt_setFixedFrameSemitransparency(true);
            vino.loading_setIconAppear(true);
            var currentTime = tvii.getLockedHourTimestamp();
            tvii.requestProgramGuide(
                currentTime,
                lineup_tz,
                lineup,
                duration,
                limit,
                offset,
                function (guide) {
                    setProgramDivAttribute(guide);
                    updateTabListProgram();
                    window.setListenerToProgram();
                    updatePagiMenuState();
                    vino.loading_setIconAppear(false);
                    vino.lyt_setFixedFrameSemitransparency(false);
                    guide = null;
                    requested = false;
                    $(".program-list .content")
                        .stop()
                        .animate({ scrollTop: 0 }, 200)
                        .promise()
                        .done(function () {
                            var first = $(".program-list .content .program").first();
                            currentSnappedElement = first.get(0);
                            programPreviewUpdate(first);
                            disableTopBotHeaders(false);
                            $button.removeClass("selected");
                        });
                },
                function () {
                    vino.loading_setIconAppear(false);
                    requested = false;
                    disableTopBotHeaders(false);
                    $button.removeClass("selected");
                }
            );
        }

        function updatePagiMenuState() {
            var $prev = $(".pagi-menu .prev");
            var $next = $(".pagi-menu .next");
            var $counter = $(".pagi-menu > span");

            // Total pages based on total/limit (rounded up)
            var totalPages = Math.ceil(total / limit);
            var currentPage = Math.floor(offset / limit) + 1;

            // Update counter
            $counter.html(currentPage + "<span>/" + totalPages + "</span>");

            // Enable/disable prev
            if (offset === 0) {
                $prev.addClass("disabled");
            } else {
                $prev.removeClass("disabled");
            }

            // Enable/disable next
            if (offset + limit >= total) {
                $next.addClass("disabled");
            } else {
                $next.removeClass("disabled");
            }
        }

        // Initialize PagiMenu state on first load
        updatePagiMenuState();
    }

    function programConfirmSel(program, isTriggered) {
        var programDetails = $(".program-central .program-details");
        if (!programDetails.is(":visible")) {
            return;
        }
        if (!isTriggered) {
            vino.lyt_startTouchEffect();
        }
        vino.soundPlayVolume("SE_APPEAR_DETAIL", 30);
        vino.lyt_decideFixedFrame();
        setupProgramPageWithAnimFromList();
    }

    var isPrgmPageMoveDisabled = false;

    function splitDescriptionSlides(det, fullText) {
        var firstSlide = det.find(".program-detail-desc").first();
        if (!firstSlide.length) return;

        // remove previously generated slides
        firstSlide.siblings(".program-detail-desc").remove();

        var remainingText = fullText || "";
        var lastInserted = firstSlide;

        firstSlide.find("p").text("");

        while (remainingText.length) {
            var slide;

            // use first slide if empty
            if (!lastInserted.find("p").text()) {
                slide = lastInserted;
            } else {
                slide = firstSlide.clone(true);
                slide.find("p").text("");

                // remove "Details" label in cloned slides
                slide.find('[data-loc="vino.home.program.details_label"]').remove();

                // insert after previous description slide
                lastInserted.after(slide);
                lastInserted = slide;
            }

            var p = slide.find("p")[0];
            var text = remainingText;

            // try full text first
            p.textContent = text;

            // fits fully → done
            if (p.scrollHeight <= p.clientHeight) break;

            var cut = text.length;

            // shrink until fits
            while (cut > 0) {
                cut -= Math.ceil(text.length / 20);
                if (cut < 1) cut = 1;

                var candidate = text.substring(0, cut);

                // snap to last whitespace so words don't break
                var lastSpace = candidate.lastIndexOf(" ");
                if (lastSpace > 0) {
                    candidate = candidate.substring(0, lastSpace);
                }

                p.textContent = candidate;

                if (p.scrollHeight <= p.clientHeight) {
                    cut = candidate.length;
                    break;
                }
            }

            // move remainder to next slide
            remainingText = text.substring(cut).trim();

            // safety escape (avoid infinite loop)
            if (cut <= 0) break;
        }
    }

    function paginateActors(det, castList) {
        var firstSlide = det.find(".program-actors").first();
        if (!firstSlide.length) return;

        var actorsPerSlide = 6;
        var total = castList.length;

        // remove previously generated slides
        firstSlide.siblings(".program-actors").remove();

        // clear first slide actors but keep "view all cast" link
        firstSlide.find(".actor-container a:not(.actor-link)").remove();

        var lastInserted = firstSlide;

        for (var i = 0; i < total; i += actorsPerSlide) {
            var slice = castList.slice(i, i + actorsPerSlide);
            var slide;

            if (i === 0) {
                slide = firstSlide;
            } else {
                slide = firstSlide.clone(true);

                // remove existing actor entries
                slide.find(".actor-container a:not(.actor-link)").remove();

                slide.find(".actor-link").remove();

                // insert right after previous actor slide
                lastInserted.after(slide);
                lastInserted = slide;
            }

            var actorContainer = slide.find(".actor-container");

            for (var j = 0; j < slice.length; j++) {
                var member = slice[j];

                var $a = $("<a>", {
                    href: "javascript:void(0)",
                    navi_target: ""
                });

                var bgUrl = "/img/noimg.png";

                if (
                    member.img &&
                    member.img !== "https://www.tvpassport.com/resource/img/generics/null-person-sm.png"
                ) {
                    var idx = member.img.indexOf("/image/people/");
                    var path = idx !== -1 ? member.img.substring(idx + 1) : null;

                    if (path) {
                        path = path.replace(/(\d+)x(\d+)/, "108x144");
                        bgUrl = "/images/cdn/tvp/" + path;
                    }
                }

                var imgContDiv = $("<div>").addClass("photo");
                var $imgDiv = $("<div>").css("background-image", "url(" + bgUrl + ")");
                var $name = $("<span>").text(member.name);

                imgContDiv.append($imgDiv)
                $a.append(imgContDiv).append($name);

                actorContainer.append($a);
            }
        }

        var sounds = [
            "SE_WORD_A", "SE_WORD_E", "SE_WORD_I",
            "SE_WORD_O", "SE_WORD_U", "SE_WORD_N"
        ];

        tvii.setActualClickListener($(".actor-container a:not(.actor-link)"), function () {
            var sound = sounds[Math.floor(Math.random() * sounds.length)];
            vino.soundPlayVolume(sound, 60);

            alert(tvii.getLoc("vino.home.not_available_actor_feature"));
        });
    }


    function setupProgramPage(programObject) {
        //WithAnim already locks it but this gets called when it doesnt do animation
        //lock again
        if (!isHeaderButtonBlocked) {
            disableTopBotHeaders(true);
        }

        //sets to the push State instance the listing queries
        tvii.pushStateWithQuery("scene", "pprev", true, programObject);

        //Now start
        vino.loading_setIconRect(360, 160, 120, 120);
        vino.loading_setIconAppear(true);

        tvii.requestProgramDetails(
            programObject.programListingId,
            programObject.programChannelNum,
            programObject.programDate,
            function (details) {
                var htmlProgramDetails = $(".program-fulldetails-page-template").html();
                det.html(htmlProgramDetails);
                det.show();

                var prodet = det.find(".program-details");

                /*var programListingID = details.program.listingId;
                var episodeID = details.program.showId;*/

                var channelNumber = details.channel.number;
                var channelName = details.channel.name;
                var programName = details.program.showName;
                var programEpisode = details.program.episodeTitle;
                var hasYear = details.program.year && details.program.year.length;
                var hasShowType = details.program.showType && details.program.showType.length;
                var hasTVRating = details.program.rating && details.program.rating.length;
                var hasCC = details.program.isCC;
                var programDuration = details.program.duration;
                var programDescription = details.program.description;

                var chlogo = prodet.find(".chlogo");

                if (details.channel.logo) {
                    var logoSrc = "/images/cdn/tvp" + details.channel.logo;
                    logoSrc = logoSrc.replace(/(station\/)[^\/]+(\/v2)/, '$160x34$2');

                    chlogo.on("error", function () {
                        chlogo.hide();
                    });

                    chlogo.attr("src", logoSrc)
                } else {
                    chlogo.attr("src", "/img/no-ch-logo.png");
                    chlogo.addClass("no-icon");
                }

                var img = details.extra_program ? details.extra_program.image : null;

                var isValidImage =
                    img && img.indexOf("/resource/img/generics/") === -1;

                if (isValidImage) {
                    img = img.replace(/^.*?(\/image\/)/, "$1");
                    img = img.replace(/\/\d+x\d+\//, "/400x225/");
                } else if (details.program.showPicture) {
                    //if show picture exists, set isValidImage to true
                    isValidImage = true;
                    img = "/image/show/400x225/" + details.program.showPicture;
                }

                if (isValidImage) {
                    det.find(".program-image>img").attr("src", "/images/cdn/tvp" + img)
                } else {
                    det.find(".program-image-detail").remove();
                }

                var parts = [];

                if (hasYear) parts.push(details.program.year);
                if (hasTVRating) parts.push(details.program.rating);
                if (hasCC) parts.push("CC");

                det.find(".og-duration .text").text(tvii.getLoc("vino.home.program.airing_duration.duration", programDuration));

                if (hasShowType) {
                    det.find(".genre .text").text(details.program.showType);
                    det.find(".genre").show();
                }


                var otherDetail = parts.join(" · ");

                prodet.find(".prinfo .info-other").text(otherDetail);

                var tag = prodet.find(".tag");

                if (details.program.isLive) {
                    tag.addClass("tagl");
                    tag.text(tvii.getLoc("vino.home.lst.live"));
                    tag.show();
                } else if (details.program.isNew) {
                    tag.addClass("tagn");
                    tag.text(tvii.getLoc("vino.home.lst.new"));
                    tag.show();
                } else {
                    tag.text("");
                    tag.hide();
                }

                if (details.extra_program) {
                    if (details.extra_program.description && details.extra_program.description != programDescription) {
                        splitDescriptionSlides(det, details.extra_program.description);
                    } else {
                        det.find(".program-detail-desc").remove();
                    }

                    if (details.extra_program.cast && details.extra_program.cast.length) {
                        paginateActors(det, details.extra_program.cast);
                    } else {
                        det.find(".program-actors").remove();
                    }

                } else {
                    det.find(".program-detail-desc").remove();
                    det.find(".program-actors").remove();
                }

                prodet.find(".program-description > p").text(programDescription);

                const span = head2.find("p > span");
                const p2 = head2.find("p");

                if (!span.length || !p2.length) return;

                // set text
                span.text(
                    programEpisode && programEpisode != programName
                        ? programName + "「" + programEpisode + "」"
                        : programName
                );

                // reset marquee
                p2.removeClass("marquee");

                // force layout
                const pEl = p2[0];
                const spanEl = span[0];

                pEl.offsetWidth;
                spanEl.offsetWidth;
                // enable marquee if overflow
                if (spanEl.scrollWidth > pEl.clientWidth) {
                    p2.addClass("marquee");
                }

                prodet.find(".chnumber").text(channelNumber);
                prodet.find(".chname").text(channelName);

                var programStart = tvii.parseLocalDateTime(details.program.start);
                var programEnd = tvii.parseLocalDateTime(details.program.end);

                var timeStr = formatAMPMWithDate(programStart, programEnd);
                prodet.find(".date").text(timeStr);

                tvii.templates.setUpLocHTML();
                setProgramDetailsListener();

                vino.loading_setIconAppear(false);
                disableTopBotHeaders(false);
            },
            function () {
                vino.loading_setIconAppear(false);
                disableTopBotHeaders(false);
            }
        );
    }

    //-------------------Program Page, global container reference--------------------------
    var hdrAnimSp = 250;

    var top = $(".top");
    var footer = $(".footer");
    var head = $(".header.home-page");
    var headOlv = $(".header.miiverse");
    var head2 = $(".header.pr-details");
    var bott = $(".bottom");
    var det = $(".program-fulldetails-page");
    var cent = $(".program-central");
    var grid = $(".guide-view");

    function setupProgramPageWithAnimFromList() {
        disableTopBotHeaders(true);
        programListScroll = $(".program-list .content").scrollTop();
        cent.hide();

        top.stop(true, true).animate(
            {
                scrollTop: top[0].scrollHeight,
            },
            hdrAnimSp
        );

        footer.stop(true, true).animate(
            {
                scrollTop: 0,
            },
            hdrAnimSp
        );

        setTimeout(function () {
            head.hide();
            head2.show();
            bott.addClass("prfuldet");

            top.scrollTop(top[0].scrollHeight);

            top.stop(true, true).animate(
                {
                    scrollTop: 0,
                },
                hdrAnimSp - 100
            );

            footer.stop(true, true).animate(
                {
                    scrollTop: footer[0].scrollHeight,
                },
                hdrAnimSp,
                function () {
                    setTimeout(function () {
                        //Actually set up Program Page
                        //setupProgramPage handles disabling lock controls!

                        var details = $(".program-details");
                        setupProgramPage({
                            programListingId: details.attr("data-prlistid"),
                            programDate: details.attr("data-prlist-date"),
                            programChannelNum: details.attr("data-chnum"),
                        });
                    }, 0);
                }
            );
        }, hdrAnimSp);
    }

    function closeProgramPageWithAnim(page) {
        disableTopBotHeaders(true);
        var isLiveTab = page === "livetab";
        var isGuideTab = page === "guidetab";

        det.hide();

        top.stop(true, true).animate(
            {
                scrollTop: top[0].scrollHeight,
            },
            hdrAnimSp
        );

        footer.stop(true, true).animate(
            {
                scrollTop: 0,
            },
            hdrAnimSp
        );

        setTimeout(function () {
            head2.find("span").text("");
            //emptied div
            det.empty();
            det.hide();
            //good chance to GC
            vino.requestGarbageCollect();
            head2.hide();
            head.show();
            bott.removeClass("prfuldet");
            if (isGuideTab) {
                bott.addClass("guideopt");
            }

            top.scrollTop(top[0].scrollHeight);

            top.stop(true, true).animate(
                {
                    scrollTop: 0,
                },
                hdrAnimSp - 100,
                function () {
                    if (isLiveTab) {
                        cent.show();
                        $(".program-list .content").scrollTop(programListScroll);
                        drawLyt();
                    } else if (isGuideTab) {
                        vino.navi_setBaseVisibilityOnKeyEvent(true);
                        grid.show();
                    }
                    disableTopBotHeaders(false);
                }
            );

            footer.stop(true, true).animate(
                {
                    scrollTop: footer[0].scrollHeight,
                },
                hdrAnimSp
            );
        }, hdrAnimSp);
    }

    function setProgramDetailsListener() {
        tvii.setClassHoverToEls($(".next-page, .prev-page"));

        var $container = det.find(".content");
        var $prev = det.find(".prev-page");
        var $next = det.find(".next-page");

        var segmentWidth = 427; // each scroll segment
        var visibleWidth = 854; // container visible area

        var isDragging = false;
        var startX = 0;
        var scrollStart = 0;

        function getMaxScroll() {
            return Math.max($container[0].scrollWidth - visibleWidth, 0);
        }

        // snap scroll to nearest segment
        function snapToSegment(scrollLeft) {
            var segment = Math.round(scrollLeft / segmentWidth);
            return segment * segmentWidth;
        }

        function updateButtons() {
            var scrollLeft = $container.scrollLeft();
            var maxScroll = getMaxScroll();

            // if content fits inside visible width → no scrolling needed
            if ($container[0].scrollWidth <= visibleWidth) {
                $prev.hide();
                $next.hide();
                return;
            }

            if (scrollLeft <= 0) {
                $prev.hide();
            } else {
                $prev.show();
            }

            if (scrollLeft >= maxScroll - 1) {
                $next.hide();
            } else {
                $next.show();
            }
        }

        function stopDragging() {
            isDragging = false;
            $(document).off("mousemove.programDrag");
            $(document).off("mouseup.programDrag");
            $("body").removeClass("no-select");
        }

        // ========================
        // PREV BUTTON
        // ========================
        $prev.on("click", function (e) {
            if (isPrgmPageMoveDisabled || isHeaderButtonBlocked) return;

            stopDragging();
            isPrgmPageMoveDisabled = true;

            if (e.originalEvent && !vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }

            vino.soundPlayVolume("SE_MOVEPAGE_PLAY", 30);

            var current = $container.scrollLeft();
            var target = Math.max(current - segmentWidth, 0);

            target = snapToSegment(target);

            $container.animate({ scrollLeft: target }, 200, function () {
                updateButtons();
                isPrgmPageMoveDisabled = false;
            });
        });

        // ========================
        // NEXT BUTTON
        // ========================
        $next.on("click", function (e) {
            if (isPrgmPageMoveDisabled || isHeaderButtonBlocked) return;

            stopDragging();
            isPrgmPageMoveDisabled = true;

            if (e.originalEvent && !vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }

            vino.soundPlayVolume("SE_MOVEPAGE_PLAY", 30);

            var maxScroll = getMaxScroll();
            var current = $container.scrollLeft();
            var target = Math.min(current + segmentWidth, maxScroll);

            target = snapToSegment(target);

            $container.animate({ scrollLeft: target }, 200, function () {
                updateButtons();
                isPrgmPageMoveDisabled = false;
            });
        });

        // ========================
        // DRAG SCROLLING
        // ========================
        $container.on("mousedown", function (e) {
            if (isPrgmPageMoveDisabled) return;

            isDragging = true;
            startX = e.pageX;
            scrollStart = $container.scrollLeft();

            $("body").addClass("no-select");

            $(document).on("mousemove.programDrag", function (e) {
                if (!isDragging) return;

                var delta = startX - e.pageX;
                $container.scrollLeft(scrollStart + delta);
            });

            $(document).on("mouseup.programDrag", function (e) {
                if (!isDragging) return;

                var scrollLeft = $container.scrollLeft();
                var maxScroll = getMaxScroll();

                // how far user dragged
                var dragDistance = startX - e.pageX;

                // how sensitive snapping is (lower = easier)
                var snapThreshold = segmentWidth * 0.15;

                var target;

                if (Math.abs(dragDistance) > snapThreshold) {
                    // move to next or prev segment
                    if (dragDistance > 0) {
                        // dragged left → next
                        target = Math.ceil(scrollLeft / segmentWidth) * segmentWidth;
                    } else {
                        // dragged right → prev
                        target = Math.floor(scrollLeft / segmentWidth) * segmentWidth;
                    }
                } else {
                    // not enough movement → snap back to nearest
                    target = snapToSegment(scrollLeft);
                }

                if (target < 0) target = 0;
                if (target > maxScroll) target = maxScroll;

                isPrgmPageMoveDisabled = true;

                $container.animate(
                    { scrollLeft: target },
                    200,
                    function () {
                        isPrgmPageMoveDisabled = false;
                        updateButtons();
                    }
                );

                stopDragging();
            });
        });

        // ========================
        // INITIAL BUTTON STATE
        // ========================
        updateButtons();
    }



    //--------Posting/"Miiverse" as it is codenamed here, since it used to be actual Miiverse posts-------

    function openMiiversePageWithAnim() {
        disableTopBotHeaders(true);
        cleanMiiversePage();
        vino.lyt_reset();
        //If is program list, hide program list stuff,
        //Else we assume its program page

        var isProgramList = $(".program-list").is(":visible");

        var olvProgramId = $(".program-details").attr("data-prlistid");
        var olvChannelNum = $(".program-details").attr("data-chnum");
        var olvProgramInfoDate = $(".program-details").attr("data-prlist-date");

        if (isProgramList) {
            programListScroll = $(".program-list .content").scrollTop();
            cent.hide();
        } else {
            programPreviewScroll = $(
                ".program-fulldetails-page .content"
            ).scrollLeft();
            det.hide();
        }

        top.animate(
            {
                scrollTop: top[0].scrollHeight,
            },
            hdrAnimSp
        );

        footer.animate(
            {
                scrollTop: 0,
            },
            hdrAnimSp
        );

        setTimeout(function () {
            if (isProgramList) {
                head.hide();
            } else {
                head2.hide();
                $(".program-fulldetails-page .content")
                    .stop(true, true)
                    .scrollLeft(0);
            }
            headOlv.show();
            bott.removeClass("prfuldet");
            bott.addClass("miiverse");
            //Same thing done when requesting posts but we do repeat the action in case
            //This type of thing is done multiple times
            $(".miiverse-post").addClass("disabled");
            $(".miiverse-refresh").addClass("disabled");
            $(".miiverse-doodle-default").addClass("disabled");
            top.scrollTop(top[0].scrollHeight);
            //$(det).fadeIn(190);

            top.animate(
                {
                    scrollTop: 0,
                },
                hdrAnimSp - 100
            );

            footer.animate(
                {
                    scrollTop: footer[0].scrollHeight,
                },
                hdrAnimSp,
                function () {
                    var olvModalHtml = $(".miiverse-modal-template").html();
                    $(".miiverse-modal").html(olvModalHtml);
                    $(".miiverse-modal").show();
                    miiverseContainer = $(".miiverse-modal .post-container").makeScrollContainer(false);
                    setMiiverseListeners();

                    vino.loading_setIconRect(360, 160, 120, 120);
                    tvii.pushStateWithQuery("scene", "olvview", true);

                    tvii.requestProgramDetails(
                        olvProgramId,
                        olvChannelNum,
                        olvProgramInfoDate,
                        function (details) {
                            var programName = details.program.showName;
                            var programEpisode = details.program.episodeTitle;

                            var topicTagHeader = programName;

                            if (details.program.teamInfo) {
                                if (details.program.teamInfo.league &&
                                    details.program.teamInfo.team1 &&
                                    details.program.teamInfo.team2
                                ) {
                                    topicTagHeader = details.program.teamInfo.league + ": " +
                                        details.program.teamInfo.team1 + " v. " + details.program.teamInfo.team2;
                                }
                            } else if (
                                details.program.episodeTitle &&
                                details.program.episodeTitle != details.program.showName
                            ) {
                                var episodeTitle = details.program.episodeTitle;

                                // limit to 30 chars
                                if (episodeTitle.length > 30) {
                                    episodeTitle = episodeTitle.slice(0, 30) + "...";
                                }

                                topicTagHeader += "「" + episodeTitle + "」";
                            }

                            headOlv.attr("data-olv-prname", programName)
                            headOlv.attr("data-olv-topictag", topicTagHeader)
                            headOlv.attr("data-olv-prepisode", programEpisode)
                            headOlv.attr("data-olv-channelid", details.channel.id)
                            headOlv.attr("data-olv-episodeid", details.program.showId)
                            headOlv.attr("data-olv-parentid", details.program.seriesId)

                            var text = programName;

                            if (programEpisode && programEpisode != programName) {
                                // Normal case: add episode title if it exists and is different
                                text += "「" + programEpisode + "」";
                            }

                            headOlv.find("span").text(text);

                            vino.navi_setMoveMethod(1);
                            requestPostsMiiversePage();
                        },
                        function () {
                            tvii.alert(
                                tvii.getLoc(
                                    "vino.error.default_error"
                                )
                            );
                            disableTopBotHeaders(false);
                        }
                    );
                }
            );
        }, hdrAnimSp);
    }

    function cleanMiiversePage() {
        headOlv.attr("data-olv-topictag", "")
        headOlv.attr("data-olv-prname", "")
        headOlv.attr("data-olv-prepisode", "")
        headOlv.attr("data-olv-episodeid", "")
        headOlv.attr("data-olv-channelid", "")
        headOlv.attr("data-olv-parentid", "")
        headOlv.find("span").text("");
        if (miiverseContainer) {
            detachMiiverseScrollListener(); // ensure no old listeners
        }
        miiverseContainer = null;
        $(".miiverse-modal").empty();
    }

    function closeMiiversePageWithAnim(page) {
        disableTopBotHeaders(true);

        //Clean HTML for memory managment
        cleanMiiversePage();
        $(".miiverse-modal").hide();

        var isLiveTab = page === "livetab";
        var isProgramPreview = page === "pprev";

        console.log("closing miiverse with livetab: ", isLiveTab);
        console.log("closing miiverse with progprev: ", isProgramPreview);

        top.animate(
            {
                scrollTop: top[0].scrollHeight,
            },
            hdrAnimSp
        );

        footer.animate(
            {
                scrollTop: 0,
            },
            hdrAnimSp
        );

        setTimeout(function () {
            headOlv.hide();
            bott.removeClass("miiverse");
            vino.navi_setMoveMethod(0);

            if (isProgramPreview) {
                head2.show();
                det.show();
                det.find(".content").scrollLeft(
                    programPreviewScroll
                );
                bott.addClass("prfuldet");
            } else if (isLiveTab) {
                head.show();
            }

            top.scrollTop(top[0].scrollHeight);

            top.animate(
                {
                    scrollTop: 0,
                },
                hdrAnimSp - 100,
                function () {
                    if (isLiveTab) {
                        cent.show();
                        $(".program-list .content").scrollTop(
                            programListScroll
                        );
                        drawLyt();
                    }
                }
            );

            footer.animate(
                {
                    scrollTop: footer[0].scrollHeight,
                },
                hdrAnimSp
            );

            disableTopBotHeaders(false);
        }, hdrAnimSp);
    }

    function parseDateWithOffset(dateString, offsetSeconds) {
        // Remove milliseconds and Z, replace T with space
        dateString = dateString.replace("T", " ").replace("Z", "");
        dateString = dateString.replace(/\.\d+$/, ""); // remove .sss if present

        var parts = dateString.split(/[- :]/);
        var year = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1; // JS months are 0-based
        var day = parseInt(parts[2], 10);
        var hour = parseInt(parts[3], 10);
        var minute = parseInt(parts[4], 10);
        var second = parseInt(parts[5], 10) || 0; // default to 0 if missing

        // Treat as UTC, then apply custom offset
        var utcTime = Date.UTC(year, month, day, hour, minute, second);
        return new Date(utcTime + offsetSeconds * 1000);
    }

    function miiverseDateFormat(dateString) {
        var lang = tvii.getLang();
        var offsetSeconds = tvii.getUtcOffset();

        // "now" also adjusted by offset
        var now = new Date(new Date().getTime() + offsetSeconds * 1000);
        var date = parseDateWithOffset(dateString, offsetSeconds);
        var diffSeconds = Math.floor((now - date) / 1000);

        if (diffSeconds < 60) {
            return tvii.getLoc("vino.home.olv.crosspost.post.time.less_than_minute_ago");
        } else if (diffSeconds < 120) {
            return tvii.getLoc("vino.home.olv.crosspost.post.time.minute_ago");
        } else if (diffSeconds < 3600) {
            return tvii.getLoc(
                "vino.home.olv.crosspost.post.time.minutes_ago",
                Math.floor(diffSeconds / 60)
            );
        } else if (diffSeconds < 7200) {
            return tvii.getLoc("vino.home.olv.crosspost.post.time.hour_ago");
        } else if (diffSeconds < 86400) {
            return tvii.getLoc(
                "vino.home.olv.crosspost.post.time.hours_ago",
                Math.floor(diffSeconds / 3600)
            );
        } else if (diffSeconds < 172800) {
            return tvii.getLoc("vino.home.olv.crosspost.post.time.day_ago");
        } else if (diffSeconds < 604800) {
            return tvii.getLoc(
                "vino.home.olv.crosspost.post.time.days_ago",
                Math.floor(diffSeconds / 86400)
            );
        }

        // ===== fallback formatting =====
        var m = date.getMonth() + 1;
        var d = date.getDate();
        var y = date.getFullYear();
        var hh = date.getHours();
        var mm = date.getMinutes();

        if (m < 10) m = "0" + m;
        if (d < 10) d = "0" + d;
        if (mm < 10) mm = "0" + mm;

        // ENGLISH → 12h + AM/PM + month first
        if (lang === "en") {
            var ampm = hh >= 12 ? "PM" : "AM";

            hh = hh % 12;
            if (hh === 0) hh = 12;
            if (hh < 10) hh = "0" + hh;

            return m + "/" + d + "/" + y + " " + hh + ":" + mm + " " + ampm;
        }

        // NON-EN → 24h + day first (Spanish/French)
        if (hh < 10) hh = "0" + hh;

        return d + "/" + m + "/" + y + " " + hh + ":" + mm;
    }

    var pid = tvii.getServerPID();
    var miiverseIsLoading = false;
    var miiverseReachedEnd = false;
    var miiversePostsLimit = 25;
    var miiverseMaxPosts = 280;
    var miiverseLoadedCount = 0;

    var miiverseContainer = null;

    function detachMiiverseScrollListener() {
        if (miiverseContainer) {
            miiverseContainer.off("scroll.miiverse");
        }
    }

    function attachMiiverseScrollListener() {
        if (miiverseContainer) {
            miiverseContainer.off("scroll.miiverse").on("scroll.miiverse", onMiiverseScroll);
        }
    }

    function onMiiverseScroll() {
        var scrollTop = miiverseContainer.scrollTop();
        var scrollHeight = miiverseContainer.prop("scrollHeight");
        var clientHeight = miiverseContainer.innerHeight();

        if (scrollTop + clientHeight >= scrollHeight - 160) {
            var $lastPost = miiverseContainer.find(".post").last();
            var lastPostId = $lastPost.data("post-id");
            console.log("SCROLLED TO END")
            loadMiiversePosts(lastPostId, false);
        }
    }


    function loadMiiversePosts(lastPostId, isFirstLoad) {
        if (miiverseIsLoading || miiverseReachedEnd || miiverseLoadedCount >= miiverseMaxPosts) return;
        disableTopBotHeaders(true);
        miiverseIsLoading = true;
        $(".miiverse-post").addClass("disabled");
        $(".miiverse-refresh").addClass("disabled");
        $(".miiverse-doodle-default").addClass("disabled");

        var episodeId = headOlv.attr("data-olv-episodeid");

        vino.loading_setIconAppear(true);

        tvii.posts.requestPosts(
            miiversePostsLimit,
            lastPostId || null,
            ["PR" + episodeId],
            function (posts) {
                miiverseIsLoading = false;
                console.log(miiverseLoadedCount)

                if (!posts || !posts.length) {
                    miiverseReachedEnd = true;
                    detachMiiverseScrollListener();
                    vino.loading_setIconAppear(false);
                    $(".miiverse-post").removeClass("disabled");
                    $(".miiverse-refresh").removeClass("disabled");
                    $(".miiverse-doodle-default").removeClass("disabled");
                    miiverseContainer.append(
                        $("<div>").addClass("no-posts").html(
                            tvii.getLoc("vino.home.olv.no_posts"))
                    );
                    disableTopBotHeaders(false);
                    return;
                }

                miiverseLoadedCount += posts.length;

                if (!lastPostId && posts[0]) {
                    setMiiversePostProgPreview(posts[0]);
                }

                var frag = document.createDocumentFragment();
                for (var i = 0; i < posts.length; i++) {
                    var postEl = buildPostElement(posts[i]);
                    frag.appendChild(postEl[0]);
                }

                miiverseContainer.append(frag);

                if (isFirstLoad) {
                    if (posts.length < miiversePostsLimit) {
                        miiverseReachedEnd = true;
                        detachMiiverseScrollListener();
                    } else {
                        attachMiiverseScrollListener();
                    }
                } else {
                    if (miiverseLoadedCount >= miiverseMaxPosts || posts.length < miiversePostsLimit) {
                        miiverseReachedEnd = true;
                        detachMiiverseScrollListener();
                    }
                }

                if (miiverseLoadedCount >= miiverseMaxPosts) {
                    miiverseReachedEnd = true;
                    detachMiiverseScrollListener();
                }

                vino.loading_setIconAppear(false);
                $(".miiverse-post").removeClass("disabled");
                $(".miiverse-refresh").removeClass("disabled");
                $(".miiverse-doodle-default").removeClass("disabled");
                disableTopBotHeaders(false);
            },
            function (err) {
                miiverseIsLoading = false;
                vino.loading_setIconAppear(false);
                $(".miiverse-post").removeClass("disabled");
                $(".miiverse-refresh").removeClass("disabled");
                $(".miiverse-doodle-default").removeClass("disabled");
                tvii.alert(tvii.getLoc("vino.error.default_error"));
                disableTopBotHeaders(false);
            }
        );
    }

    function requestPostsMiiversePage() {
        $(".miiverse-post").addClass("disabled");
        $(".miiverse-modal .post-container").empty();

        miiverseIsLoading = false;
        miiverseReachedEnd = false;
        miiverseLoadedCount = 0;

        //After emptying the posts
        vino.requestGarbageCollect();

        loadMiiversePosts(null, true);
    }

    function openMiiUserDetailScreen(pid) {
        disableTopBotHeaders(true);

        detachMiiverseScrollListener();
        miiverseContainer.data("makeScrollContainer").stop();
        miivContScr = miiverseContainer.scrollTop();
        miiverseContainer.hide();
        var html = $(".miiverse-user-details-template").html();
        $(".miiverse-user-details").html(html).show();
        tvii.templates.setUpLocHTML();
        setMiiUserDetailListener(pid);
    }

    var miiUserDetailInterval = null;

    function setMiiUserDetailListener(pid) {
        var miiDetModal = $(".miiverse-user-details")

        tvii.sendXHR("GET", "/api/v1/socials/getUserData/" + pid, function (data) {
            var user_data = JSON.parse(data);

            var img1 = $("<img>").attr("src", "/api/v1/miis.png?width=130&texResolution=128&expression=normal&data="
                + encodeURIComponent(user_data.mii_data) + "&type=face").hide();
            var img2 = $("<img>").attr("src", "/api/v1/miis.png?width=130&texResolution=128&expression=blink&data="
                + encodeURIComponent(user_data.mii_data) + "&type=face").hide();

            miiDetModal.append(img1)
            miiDetModal.append(img2)
            miiDetModal.find(".mii").attr("src", img1.attr("src"));
            miiDetModal.find(".mii").on("mousedown", function () {
                vino.soundPlayVolume("SE_WORD_MII_1", 30)
            });

            clearInterval(miiUserDetailInterval);
            miiUserDetailInterval = setInterval(function () {
                // change to blink image
                miiDetModal.find(".mii").attr("src", img2.attr("src"));

                // revert after 0.3s
                setTimeout(function () {
                    vino.soundPlayVolume("SE_WORD_MII_3", 30)
                    miiDetModal.find(".mii").attr("src", img1.attr("src"));
                }, 300);

            }, 3000);

            miiDetModal.find(".display-name").text(user_data.mii_name)
            miiDetModal.find(".nnid").text(user_data.user_id)
            miiDetModal.find(".post-count").text(tvii.getLoc("vino.home.olv.modal.post_count", user_data.post_count));

            if (user_data.latest_post_id && vino.olv_isEnabled() && vino.olv_getHostName() === "https://api.olv.pretendo.cc") {
                miiDetModal.find(".miiverse-jump").attr("data-post-id", user_data.latest_post_id)
                miiDetModal.find(".miiverse-jump").on("click", function (e) {
                    if (isHeaderButtonBlocked) return;
                    if ($(this).hasClass("disabled")) return;

                    if (e.originalEvent) {
                        if (!vino.navi_getRect()) {
                            vino.lyt_startTouchEffect();
                        }
                    }

                    vino.soundPlayVolume("SE_WAVE_OK_SUB", 30);
                    vino.jumpToMiiversePostId($(this).attr("data-post-id"), true);
                })
                miiDetModal.find(".miiverse-jump").removeClass("disabled");
            }

            var my_pid = vino.act_getPid(tvii.userSlot);
            if (parseInt(pid, 10) === my_pid) {
                miiDetModal.find(".friend-status .myself").show();
            } else {
                var fl = vino.fp_getFriendList();

                if (fl) {
                    var list = fl.split(",");
                    var isAdded = false;

                    for (var i = 0; i < list.length; i++) {
                        var friendPid = parseInt(list[i], 10);

                        if (friendPid === parseInt(pid, 10)) {
                            isAdded = true;
                            miiDetModal.find(".friend-status .already").show();
                            break;
                        }
                    }
                    if (!isAdded) {
                        miiDetModal.find(".friend-status .add").show();
                    }
                } else {
                    miiDetModal.find(".friend-status .add").show();
                }
            }


            miiDetModal.find(".friend-status").on("click", function (e) {
                if (isHeaderButtonBlocked) return;
                if ($(this).hasClass("disabled")) return;

                if (miiDetModal.find(".friend-status .add").is(":visible")) {
                    if (e.originalEvent) {
                        if (!vino.navi_getRect()) {
                            vino.lyt_startTouchEffect();
                        }
                    }

                    vino.soundPlayVolume("SE_WAVE_OK_SUB", 30);

                    if (confirm(tvii.getLoc("vino.home.olv.modal.ask_adding_friend"))) {
                        vino.exitForce();
                    }
                }
            })

            disableTopBotHeaders(false);
        }, function () {
            disableTopBotHeaders(false);
        });
        //Back button on post modal
        miiDetModal.find(".btn-1").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }

            vino.soundPlayVolume("SE_WAVE_CANCEL", 30);

            clearInterval(miiUserDetailInterval);
            miiDetModal.empty();
            miiDetModal.hide();
            miiDetModal = null;
            //after disposing detail modal
            vino.requestGarbageCollect();

            miiverseContainer.show();
            miiverseContainer.scrollTop(miivContScr);
            attachMiiverseScrollListener();
        });
    }

    function buildPostElement(post) {
        var miiData = post.mii_data;
        var postId = post.post_id;
        var replyAmount = 0;
        var miitooAmount = 0;
        var feeling = post.feeling_id;
        var feelingQ = getFeelingQueryFromPostXml(feeling);
        var postText = post.body;
        var painting = post.painting;
        var postScreenshot = post.screenshot;
        var screenName = post.mii_name;
        var postDate = post.create_time;
        var empathies = post.empathies || [];
        var isSpoiler = post.is_spoiler;

        var content = null;

        if (postText && postText.length) {
            content = $("<p>");
            content.text(postText);
        } else if (painting && painting.length) {
            content = new Image();
            content.classList.add("memo");
            content.src = "/images/cdn/" + painting;
        }

        var $postEl = $("<div>")
            .addClass("post")
            .attr("data-post-id", postId);

        var miiImg = new Image();
        miiImg.src =
            "/api/v1/miis.png?width=75&expression=" +
            feelingQ +
            "&data=" +
            encodeURIComponent(miiData) +
            "&type=face";
        var miiEl = (function () {
            return $("<div>")
                .addClass("mii")
                .append(miiImg)
                .attr("data-user-pid", post.pid)
                .attr("tabindex", 0)
                .attr("navi_target", "")
                .attr("navi_no_reset", "")
                .on("mousedown", function () {
                    vino.soundPlayVolume("SE_WORD_MII", 30);
                })
                .on("click", function () {
                    openMiiUserDetailScreen(miiEl.attr("data-user-pid"));
                });
        })();

        var username = $("<span>")
            .addClass("username")
            .text(screenName);

        if (screenName === "Project Rosé Staff") {
            username.css("background", "#f05b00");
        }

        var date = $("<span>")
            .addClass("date")
            .text(miiverseDateFormat(postDate));

        var postCont = $("<div>").addClass("post-content");

        var postRCont = $("<div>");
        postRCont.addClass("content");
        if (isSpoiler) {
            postRCont.addClass("hidden");
        }

        var ss = new Image();
        ss.src = postScreenshot ? "/images/cdn/" + postScreenshot + "?width=384" : "/img/noimg.png";

        var ssDiv = $("<div>");
        ssDiv.append(ss).addClass("screenshot").attr("tabindex", "0").attr("navi_target", "").attr("data-screenshot", postScreenshot ? postScreenshot : "/img/noimg.ong")

        if (postScreenshot && postText) {
            postRCont.append(content);
            postRCont.append(ssDiv);
        } else if (postScreenshot && painting) {
            postRCont.append(ssDiv);
            postRCont.append(content);
        } else {
            postRCont.append(content);
        }

        postCont.append(postRCont);

        var postMeta = $("<div>").addClass("post-meta");
        var postHref = $("<a>").addClass("post-href").attr("href", "javascript:void(0)").attr("navi_target", "");

        for (var a = 0; a < empathies.length; a++) {
            miitooAmount++;
        }

        var yeahCount = $("<span>")
            .addClass("yeahs")
            .text(miitooAmount);

        var hasYeahed = false;
        var isMyPost = false;

        if (post.pid === pid) {
            isMyPost = true;
        } else {
            for (var x = 0; x < empathies.length; x++) {
                if (empathies[x].pid === pid) {
                    hasYeahed = true;
                    break; // stop checking once we find a match
                }
            }
        }

        var spoilerBut = $("<button>")
            .addClass("spoiler")
            .attr("navi_target", "")
            .attr("tabindex", 0)
            .text(tvii.getLoc("vino.home.olv.crosspost.post.view_spoiler"));

        if (isSpoiler) {
            (function ($spoilerbut, $postRCont) {
                $spoilerbut.on("click", function () {
                    if (!vino.navi_getRect()) {
                        vino.lyt_startTouchEffect();
                    }
                    vino.soundPlayVolume("SE_WAVE_OK_SUB", 30);
                    $postRCont.removeClass("hidden");
                    $spoilerbut.remove();
                });
            })(spoilerBut, postRCont);
        }

        var yeahText;
        var unyeahText;

        switch (feeling) {
            case 0:
                yeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy");
                unyeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.remove");
                break;
            case 1:
                yeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.happy");
                unyeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.happy.remove");
                break;
            case 2:
                yeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.like");
                unyeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.like.remove");
                break;
            case 3:
                yeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.surprised");
                unyeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.surprised.remove");
                break;
            case 4:
                yeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.frustrated");
                unyeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.frustrated.remove");
                break;
            case 5:
                yeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.puzzled");
                unyeahText = tvii.getLoc("vino.home.olv.crosspost.post.empathy.puzzled.remove");
                break;
            default:
                break;
        }

        var empathyAct = $("<button>")
            .addClass("yeah")
            .attr("navi_target", "")
            .attr("navi_no_reset", "")
            .attr("tabindex", 0)
            .text(yeahText);

        if (isMyPost) {
            empathyAct.addClass("self");
            empathyAct.addClass("disabled");
        } else if (hasYeahed) {
            empathyAct.text(unyeahText);
            empathyAct.addClass("yeahed");
            yeahCount.addClass("added");
        }

        if (!isMyPost) {
            (function (id, $yeahCount, $empathyAct) {
                empathyAct.on("mousedown", function () {
                    if ($(this).hasClass("disabled")) return;
                    vino.soundPlayVolume("SE_COMMON_TOUCH_ON", 30);
                    $(this).addClass("hover");
                });

                empathyAct.on("mouseup mouseout", function () {
                    $(this).removeClass("hover");
                });

                empathyAct.on("click", function () {
                    var but = $(this);
                    if (but.hasClass("disabled")) return;
                    but.addClass("disabled");
                    if (!vino.navi_getRect()) {
                        vino.lyt_startTouchEffect();
                    }

                    if (but.hasClass("yeahed")) {
                        vino.soundPlayVolume("SE_WAVE_CANCEL_TOUCH_OFF", 30);
                        tvii.posts.addEmpathyToPost(
                            true,
                            id,
                            function (success) {
                                if (success) {
                                    var current =
                                        parseInt($yeahCount.text(), 10) || 0;
                                    $yeahCount.text(current - 1);
                                    $empathyAct.text(yeahText);
                                    $empathyAct.removeClass("yeahed");
                                    $yeahCount.removeClass("added");
                                }
                                but.removeClass("disabled");
                            }
                        );
                        return;
                    }

                    vino.soundPlayVolume("SE_FAVORITE_TOUCH_OFF", 30);

                    tvii.posts.addEmpathyToPost(
                        false,
                        id,
                        function (success) {
                            if (success) {
                                var current =
                                    parseInt($yeahCount.text(), 10) || 0;
                                $yeahCount.text(current + 1);
                                $empathyAct.text(unyeahText);
                                $empathyAct.addClass("yeahed");
                                $yeahCount.addClass("added");
                            }
                            but.removeClass("disabled");
                        }
                    );
                });
            })(postId, yeahCount, empathyAct);
        }

        var doodleButton = $("<button>")
            .addClass("doodle")
            .attr("tabindex", 0)
            .attr("navi_target", "")
            .text(tvii.getLoc("vino.home.olv.crosspost.post.doodlebut"));

        (function (screenshot) {
            doodleButton.on("mousedown", function () {
                vino.soundPlayVolume("SE_COMMON_TOUCH_ON", 30)
                $(this).addClass("hover");
            })

            doodleButton.on("mouseup mouseout", function () {
                $(this).removeClass("hover");
            })

            doodleButton.on("click", function () {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_WAVE_TOGGLE_CHECK_TOUCH_OFF", 30);
                openDoodleModal(screenshot.attr("data-screenshot"));
            });
        })(ssDiv);

        var jumpPost = $("<button>")
            .addClass("jump-post")
            .attr("navi_target", "")
            .attr("navi_no_reset", "")
            .attr("tabindex", 0);
        (function (id) {

            jumpPost.on("mousedown", function () {
                vino.soundPlayVolume("SE_COMMON_TOUCH_ON", 30)
                $(this).addClass("hover");
            })

            jumpPost.on("mouseup mouseout", function () {
                $(this).removeClass("hover");
            })

            jumpPost.on("click", function () {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_WAVE_OK_TOUCH_OFF", 30);
                alert(
                    tvii.getLoc("vino.home.olv.crosspost.error.no_miiverse_yet")
                );
            });
        })(postId);

        if (isSpoiler) {
            postRCont.append(spoilerBut);
        }

        postMeta.append(empathyAct);
        if (postScreenshot && postScreenshot.length) {
            postMeta.append(doodleButton);
        }
        postMeta.append(jumpPost);
        postMeta.append(yeahCount);

        postCont.append(postMeta);
        postCont.append(postHref);

        $postEl.append(miiEl);
        $postEl.append(username);
        $postEl.append(date);
        $postEl.append(postCont);

        return $postEl;
    }

    var miivContScr = 0;

    function openDoodleModal(screenshot) {
        detachMiiverseScrollListener();
        miiverseContainer.data("makeScrollContainer").stop();
        miivContScr = miiverseContainer.scrollTop();
        miiverseContainer.hide();

        var olvDoodleModalHtml = $(".miiverse-doodle-modal-template").html();
        $(".miiverse-doodle-modal").html(olvDoodleModalHtml).show();
        tvii.templates.setUpLocHTML();
        setMiiverseCanvasListener(screenshot);
    }

    function closeDoodleModal() {

        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        baseCanvas.width = 0;
        baseCanvas.height = 0;
        canvas.width = 0;
        canvas.height = 0;
        undoStack.length = 0;
        redoStack.length = 0;

        $(".miiverse-doodle-modal .menu-option a").off("click");
        $(".miiverse-doodle-modal .color-option .custom input").off("change");
        $(".miiverse-doodle-modal .size-container a").off("click");
        $(".miiverse-doodle-modal .color-option a").off("click");
        $(".miiverse-doodle-modal .back-modal").off("click");
        $(".miiverse-doodle-modal").empty().hide();

        baseCtx = null;
        ctx = null;
        canvas = null;
        baseCanvas = null;
        undoStack = null;
        redoStack = null;

        //Collect garbage from disposed modal
        vino.requestGarbageCollect();
        miiverseContainer.show();
        miiverseContainer.scrollTop(miivContScr);
        attachMiiverseScrollListener();
    }

    $(".miiverse-button").on("click", function (e) {
        var isProgramList = $(".program-list").is(":visible");
        if (isProgramList) {

        }
        if (isHeaderButtonBlocked) return;
        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
            vino.soundPlayVolume("SE_POPUP_TOUCH_OFF", 30);
        } else {
            vino.soundPlayVolume("SE_POPUP", 30);
        }
        openMiiversePageWithAnim();
    });

    var baseCanvas = null;
    var baseCtx = null;
    var canvas = null;
    var ctx = null;
    var undoStack = null;
    var redoStack = null;

    function setMiiverseCanvasListener(screenshot) {

        $(".miiverse-doodle-modal .color-option").makeScrollContainer(false);

        tvii.setClassHoverToEls(
            $(
                ".back-modal, .finish-doodle-modal"
            )
        );

        baseCanvas = document.getElementById("baseCanvas");
        baseCtx = baseCanvas.getContext('2d');
        baseCtx.fillStyle = "white";

        canvas = document.getElementById("drawCanvas");
        ctx = canvas.getContext('2d');
        var drawing = false;
        var currentColor = '#000000';
        var erasing = false;
        var currentLineWidth = 6;

        // --- Undo/Redo State ---
        undoStack = [];
        redoStack = [];
        //How much RAM does it use? We dont even know how much RAM Vino has available
        //I have decided to 7, at least once ive got an memory leak error.
        var maxStates = 7;

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
        saveState();
        // --- Drawing ---

        var lastPos = null;

        function getOffset(e) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }

        function updateButtons() {
            var $undo = $(".miiverse-doodle-modal .menu-option .undo");
            var $redo = $(".miiverse-doodle-modal .menu-option .redo");

            if (undoStack.length <= 1) {
                $undo.addClass("disabled");
            } else {
                $undo.removeClass("disabled");
            }

            if (redoStack.length === 0) {
                $redo.addClass("disabled");
            } else {
                $redo.removeClass("disabled");
            }
        }

        function saveState() {
            if (undoStack.length >= maxStates) {
                undoStack.shift();
            }
            undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            redoStack = [];
            updateButtons();
        }

        function restoreState(imageData) {
            ctx.putImageData(imageData, 0, 0);
        }

        // Handlers
        function handleMouseDown(e) {
            drawing = true;
            lastPos = getOffset(e);
        }

        function handleMouseMove(e) {
            if (!drawing) return;

            var pos = getOffset(e);

            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.lineWidth = currentLineWidth;

            if (erasing) {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentColor;
            }

            ctx.stroke();
            ctx.closePath();

            lastPos = pos;
        }

        function handleMouseUp() {
            if (drawing) {
                drawing = false;
                saveState();
            }
        }

        $(".miiverse-doodle-modal .finish-doodle-modal").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;
            //Request posts will handle enabling header
            disableTopBotHeaders(true);
            var but = $(this);
            but.addClass("disabled");
            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }

            vino.soundPlayVolume("SE_WAVE_OK_SUB_TOUCH_OFF", 30);

            var programId = headOlv.attr("data-olv-episodeid");
            var parentId = headOlv.attr("data-olv-parentid");
            var chId = headOlv.attr("data-olv-channelid");

            var searchKey1 = ("PR" + programId).trim();
            var topicTag = headOlv.attr("data-olv-topictag");
            var searchKey2 = ("PP" + parentId).trim();
            var searchKey3 = ("CH" + chId).trim();
            var searchKey4 = null;
            var searchKey5 = null;

            var text = $(".miiverse-doodle-modal .comment textarea").val();
            if (!text || !text.length) {
                alert(tvii.getLoc("vino.home.olv.crosspost.post.input_requiered"));
                disableTopBotHeaders(false);
                $(this).removeClass("disabled");
                return;
            }

            var merged = document.createElement('canvas');
            merged.width = baseCanvas.width;
            merged.height = baseCanvas.height;
            var mctx = merged.getContext('2d');

            mctx.drawImage(baseCanvas, 0, 0);
            mctx.drawImage(canvas, 0, 0);

            var dataURL = merged.toDataURL("image/png");

            tvii.posts.sendPostToApi(
                "text",
                text,
                topicTag,
                null,
                1,
                false,
                false,
                searchKey1,
                searchKey2,
                searchKey3,
                searchKey4,
                searchKey5,
                dataURL,
                onPostSendFinishAlt
            );

            function onPostSendFinishAlt(isSuccess, apiResponse) {
                if (isSuccess) {
                    //Requests Posts Miiverse Page will handle unlocking
                    closeDoodleModal();
                    setTimeout(function () {
                        requestPostsMiiversePage();
                    }, 0);
                    but.removeClass("disabled");
                } else {
                    tvii.alert(tvii.getLoc("vino.error.default_error"));
                    disableTopBotHeaders(false);
                    but.removeClass("disabled");
                }
            }
        });

        function didUserDraw() {
            return undoStack && undoStack.length > 1;
        }

        //SET DOODLE LISTENERS
        $(".miiverse-doodle-modal .menu-option a").on("click", function (e) {
            var $btn = $(this);
            var option = $btn.attr("data-option");

            // If already selected, ignore
            if ($btn.hasClass("selected") || $btn.hasClass("disabled")) {
                return;
            }

            vino.soundPlay("SE_TAB_SELECT");

            switch (option) {
                case "pencil":
                    $(".miiverse-doodle-modal .menu-option a").removeClass("selected");
                    $btn.addClass("selected");
                    erasing = false;
                    break;

                case "eraser":
                    $(".miiverse-doodle-modal .menu-option a").removeClass("selected");
                    $btn.addClass("selected");
                    erasing = true;
                    break;

                case "undo":
                    $btn.addClass("selected");
                    if (undoStack.length > 1) {
                        redoStack.push(undoStack.pop());
                        var prevState = undoStack[undoStack.length - 1];
                        restoreState(prevState);
                    }
                    updateButtons();
                    setTimeout(function () {
                        $btn.removeClass("selected");
                    }, 100);
                    break;

                case "redo":
                    $btn.addClass("selected");
                    if (redoStack.length > 0) {
                        var state = redoStack.pop();
                        undoStack.push(state);
                        restoreState(state);
                    }
                    updateButtons();
                    setTimeout(function () {
                        $btn.removeClass("selected");
                    }, 100);
                    break;

                case "clear":
                    $btn.addClass("selected");

                    if (didUserDraw()) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        saveState();
                    }
                    setTimeout(function () {
                        $btn.removeClass("selected");
                    }, 100);
                    break;
            }
        });

        $(".miiverse-doodle-modal .color-option .custom input").on("change", function (e) {
            var a = $(this);
            var custom = a.val();
            if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(custom)) {
                $(".miiverse-doodle-modal .color-option a").removeClass("selected");
                a.parent().addClass("selected");
                $(".miiverse-doodle-modal .color-option .custom span").css("background", custom)
                currentColor = custom;
                erasing = false;
            } else {
                alert(tvii.getLoc("vino.home.olv.crosspost.post.doodle_color_message"));
            }
        });

        $(".miiverse-doodle-modal .size-container a").on("click", function (e) {
            vino.soundPlay("SE_WORD_MII_1")
            if ($(this).hasClass("minus")) {
                // reduce but not below 1
                currentLineWidth = Math.max(1, currentLineWidth - 1);
            } else {
                // increase but not above 30
                currentLineWidth = Math.min(30, currentLineWidth + 1);
            }
            $(".miiverse-doodle-modal .size-container span").text(currentLineWidth);
        });

        $(".miiverse-doodle-modal .color-option a").on("click", function (e) {
            if ($(this).hasClass("selected") && !$(this).hasClass("custom")) return;

            if (!$(this).hasClass("custom")) {
                vino.soundPlay("SE_TAB_SELECT");
                $(".miiverse-doodle-modal .color-option a").removeClass("selected");
                $(this).addClass("selected");
                currentColor = $(this).find("span").css("background-color");
                erasing = false;
            }
        });

        $(".miiverse-doodle-modal .back-modal").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_CLOSE_TOUCH_OFF", 30);
            } else {
                vino.soundPlayVolume("SE_CLOSE", 30);
            }

            if (didUserDraw()) {
                if (!confirm(tvii.getLoc("vino.home.olv.crosspost.post.doodle_confirm_reset"))) {
                    return;
                }
            }

            closeDoodleModal();
        });

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);

        if (screenshot) {
            var img = new Image();
            img.onload = function () {
                baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
            };
            img.src = "/images/cdn/" + screenshot;
        } else {
            baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
        }

        //End of doodling
    }

    //Preloaded Mii feeling icons on RAM at startup
    var miiData = vino.act_getMiiData(tvii.userSlot);

    // Preload feeling images into an array
    var feelImgs = [];
    for (var i = 0; i <= 5; i++) {
        var img = new Image();
        img.src =
            "/api/v1/miis.png?width=68&expression=" +
            getFeelingQueryFromPostXml(i) +
            "&data=" +
            encodeURIComponent(miiData) +
            "&type=face";
        feelImgs[i] = img;
    }

    function setMiiversePostModalListener() {
        //MIIVERSE MODAL FUNCTIONALITY
        var miiverseModal = $(".miiverse-post-modal");

        // Attach click handler
        miiverseModal
            .find(".feeling-buttons li")
            .on("click", function () {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_WAVE_MII_FACE", 30);
                miiverseModal.find(".feeling-buttons li.checked").removeClass("checked");
                $(this).addClass("checked");

                // Swap to preloaded image src
                miiverseModal
                    .find(".mii>img")
                    .attr("src", feelImgs[parseInt($(this).find("input").first().val(), 10)].src);
            });

        // Set initial face to "normal" (or feeling 0 if that’s normal)
        miiverseModal
            .find(".mii>img")
            .attr(
                "src", feelImgs[0].src);

        miiverseModal
            .find(".textarea-text-preview")
            .text(
                miiverseModal
                    .find(".textarea-text-preview")
                    .attr("data-placeholder")
            );

        miiverseModal
            .find(".textarea-menu li label input")
            .on("click", function () {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_WAVE_TOGGLE_CHECK", 30);

                if ($(this).val() === "body") {
                    $(".textarea-memo").hide();
                    $(".textarea-text").show();
                    $(".textarea-text-input").focus();
                    vino.wakeKeyboard();
                } else {
                    $(".textarea-text").hide();
                    $(".textarea-memo").show();
                    memoStart();
                }

                $(".textarea-menu li label").removeClass("checked");
                $(this).parent().addClass("checked");
            });

        miiverseModal.find(".spoiler-button input").on("click", function (e) {
            // If the actual clicked element is the input, skip the touch effect
            if (!e.originalEvent) {
                return;
            }

            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
        });

        miiverseModal.find(".spoiler-button input").on("change", function (e) {
            if (!e.originalEvent) return; // ignore script-triggered

            var p = $(this).parent();
            if (this.checked) {
                p.addClass("checked");
                vino.soundPlayVolume("SE_WAVE_CHECKBOX_CHECK", 30);
            } else {
                p.removeClass("checked");
                vino.soundPlayVolume("SE_WAVE_CHECKBOX_UNCHECK", 30);
            }
        });

        function memoStart() {
            setTimeout(checkMemoResult, 100);
            vino.memo_open(false);
        }

        $(".textarea-memo-preview").on("click", function () {
            memoStart();
        });

        function checkMemoResult() {
            if (!vino.memo_isFinish()) {
                setTimeout(checkMemoResult, 100);
            } else {
                var memo_image = vino.memo_getImagePng();
                if (memo_image != "") {
                    var bgImage = "url(" + memo_image + ")";
                    miiverseModal
                        .find(".textarea-memo-preview")
                        .css("background-image", bgImage);
                }
            }
        }

        $(".textarea-text-input").on("change input", function () {
            $(".textarea-text-preview").text($(this).val());
            if ($(this).val().length != 0) {
                $(".textarea-text-preview").removeClass("placeholder");
            } else {
                $(".textarea-text-preview").addClass("placeholder");
                $(".textarea-text-preview").text(
                    $(".textarea-text-preview").attr("data-placeholder")
                );
            }
        });

        //Back button on post modal
        miiverseModal.find(".btn-1").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }

            vino.soundPlayVolume("SE_WAVE_CANCEL", 30);

            miiverseModal.empty();
            miiverseModal.hide();
            miiverseModal = null;

            vino.requestGarbageCollect();

            miiverseContainer.show();
            miiverseContainer.scrollTop(miivContScr);
            attachMiiverseScrollListener();
        });

        function lockPostModal(lock) {
            if (lock) {
                miiverseModal.find(".btn-1, .btn-2").addClass("disabled");
            } else {
                miiverseModal.find(".btn-1, .btn-2").removeClass("disabled");
            }
            miiverseModal
                .find(".post-menu")
                .css("pointer-events", lock ? "none" : "auto");
        }

        //Post button on post modal
        miiverseModal.find(".btn-2").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            lockPostModal(true);

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }

            vino.soundPlayVolume("SE_WAVE_OK_SUB", 30);

            var postType = miiverseModal
                .find('input[name="_post_type"]:checked')
                .val();
            var feeling = parseInt(
                miiverseModal.find(".feeling-buttons li input:checked").val(),
                10
            );

            var isSpoiler = miiverseModal
                .find(".spoiler-button input")
                .prop("checked");

            var programId = headOlv.attr("data-olv-episodeid");
            var parentId = headOlv.attr("data-olv-parentid");
            var chId = headOlv.attr("data-olv-channelid");

            var searchKey1 = ("PR" + programId).trim();
            var topicTag = headOlv.attr("data-olv-topictag");
            var searchKey2 = ("PP" + parentId).trim();
            var searchKey3 = ("CH" + chId).trim();
            var searchKey4 = null;
            var searchKey5 = null;

            if (postType === "body") {
                var text = miiverseModal.find(".textarea-text-input").val();
                if (!text || !text.length) {
                    alert(tvii.getLoc("vino.home.olv.crosspost.post.input_requiered"));
                    lockPostModal(false);
                    return;
                }
                tvii.posts.sendPostToApi(
                    "text",
                    text,
                    topicTag,
                    null,
                    feeling,
                    false,
                    isSpoiler,
                    searchKey1,
                    searchKey2,
                    searchKey3,
                    searchKey4,
                    searchKey5,
                    null,
                    onPostSendFinishAlt
                );
            } else {
                //var painting = vino.memo_getImageTgaCompressed();
                var painting = vino.memo_getImagePng();
                if (!painting || !painting.length) {
                    alert(tvii.getLoc("vino.home.olv.crosspost.post.memo_requiered"));
                    lockPostModal(false);
                    return;
                }
                tvii.posts.sendPostToApi(
                    "memo",
                    painting,
                    topicTag,
                    null,
                    feeling,
                    false,
                    isSpoiler,
                    searchKey1,
                    searchKey2,
                    searchKey3,
                    searchKey4,
                    searchKey5,
                    null,
                    onPostSendFinishAlt
                );
            }

            function onPostSendFinishAlt(isSuccess, apiResponse) {
                if (isSuccess) {
                    //Request posts will handle enabling header
                    disableTopBotHeaders(true);
                    //Reset post modal
                    vino.memo_reset();
                    lockPostModal(false);

                    miiverseModal.empty();
                    miiverseModal.hide();
                    miiverseModal = null;

                    vino.requestGarbageCollect();

                    miiverseContainer.show();
                    requestPostsMiiversePage();
                } else {
                    tvii.alert(tvii.getLoc("vino.error.default_error"));
                    lockPostModal(false);
                }
            }
        });
    }

    //This button is always present. Its literally part of the bottom.
    //FUCK MY STUPID CHUD LIFE
    $(".miiverse-post").on("click", function (e) {
        if (isHeaderButtonBlocked) return;
        if ($(this).hasClass("disabled")) return;
        detachMiiverseScrollListener();
        miiverseContainer.data("makeScrollContainer").stop();
        miivContScr = miiverseContainer.scrollTop();
        miiverseContainer.hide();
        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
            vino.soundPlayVolume("SE_POST_BTN_TOUCH_OFF", 30);
        } else {
            vino.soundPlayVolume("SE_POST_BTN", 30);
        }
        var olvPostModalHtml = $(".miiverse-post-modal-template").html();
        $(".miiverse-post-modal").html(olvPostModalHtml);

        var programName = headOlv.attr("data-olv-prname");
        tvii.templates.setUpLocHTML();
        $(".miiverse-post-modal .dialog-container .popup-header").text(
            tvii.getLoc("vino.home.olv.crosspost.post.window_title", programName)
        );
        setMiiversePostModalListener();
        $(".miiverse-post-modal").show();
    });


    function setMiiverseListeners() {

        $(".miiverse-button-menu a.miiverse-top").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }
            vino.soundPlayVolume("SE_WAVE_OK_SUB", 30);

            miiverseContainer.data("makeScrollContainer").stop();
            miiverseContainer.scrollTop(0);
        })

        $(".miiverse-button-menu a.miiverse-refresh").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }
            vino.soundPlayVolume("SE_WAVE_BALLOON_OPEN", 30);

            miiverseContainer.data("makeScrollContainer").stop();
            miiverseContainer.scrollTop(0);
            requestPostsMiiversePage();
        })

        $(".miiverse-button-menu a.miiverse-doodle-default").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }

            vino.soundPlayVolume("SE_WAVE_TOGGLE_CHECK", 30);
            openDoodleModal(null);
        });
    }

    //---------------Tab functionality, Popstate functionality-----------------------

    function initLiveTab() {
        abortReqsXhr();
        disableTopBotHeaders(true);
        tvii.pushStateWithQuery("scene", "livetab", false);
        showMiiversePostPreview(false);
        $(".guide-view").hide();
        $(".footer .bottom").removeClass("guideopt");
        $(".program-central").show();

        $(".guide-time-container").empty();
        $(".guide-channel-container").empty();

        $(".program-central").html($("#template-live-tab").html());
        $(".program-list .content").hide();

        //Set up template loc
        tvii.templates.setUpLocHTML();
        tvii.setUpPageTip();

        footer.scrollTop(footer[0].scrollHeight);
        vino.requestGarbageCollect();
        vino.navi_setBaseVisibilityOnKeyEvent(false);
        vino.loading_setIconRect(360, 160, 120, 120);
        vino.loading_setIconAppear(true);

        var currentTime = tvii.getLockedHourTimestamp();
        tvii.requestProgramGuide(
            currentTime,
            lineup_tz,
            lineup,
            duration,
            limit,
            offset,
            function (guide) {
                total = guide.total;
                setProgramDivAttribute(guide);
                updateTabListProgram();
                setUpTitleScrollbar(programPreviewUpdate, programConfirmSel);
                window.setListenerToProgram();
                setupProgramTimer();
                setContainerPagination();
                vino.loading_setIconAppear(false);

                setTimeout(function () {
                    var first = $(".program-list .content .program").first();
                    currentSnappedElement = first.get(0);
                    programPreviewUpdate(first);
                }, 0)

                drawLyt();
                disableTopBotHeaders(false);
                $(".program-list .content").show();

            },
            function () {
                disableTopBotHeaders(false);
                vino.loading_setIconAppear(false);
            }
        );
    }

    function initGuideTab() {
        abortReqsXhr();
        showMiiversePostPreview(false);
        $(".footer .bottom").addClass("guideopt");
        tvii.pushStateWithQuery("scene", "recomtab", false);
        clearInterval(window.infoUpdInterval);
        vino.lyt_reset();
        $(".guide-view").empty();
        $(".guide-view").hide();
        $(".program-central").hide();
        $(".program-central").empty();
        vino.requestGarbageCollect();
        vino.navi_setBaseVisibilityOnKeyEvent(false);
        vino.loading_setIconRect(360, 160, 120, 120);
    }

    function initRecommendedTab() {
        abortReqsXhr();
        showMiiversePostPreview(false);
        $(".footer .bottom").addClass("guideopt");
        tvii.pushStateWithQuery("scene", "recomtab", false);
        clearInterval(window.infoUpdInterval);
        vino.lyt_reset();
        $(".guide-view").empty();
        $(".program-central").hide();
        $(".program-central").empty();
        vino.requestGarbageCollect();
        vino.navi_setBaseVisibilityOnKeyEvent(false);
        vino.loading_setIconRect(360, 160, 120, 120);
    }

    function onProgramPreviewPopstate(e) {
        var canProgramDetailsBeSeen = $(".program-fulldetails-page").is(
            ":visible"
        );
        var canMiiverseViewBeSeen = $(".miiverse-modal").is(":visible");
        if (canProgramDetailsBeSeen) {
            console.log(e.state);
        } else if (canMiiverseViewBeSeen) {
            closeMiiversePageWithAnim("pprev");
        }
    }

    function onGuideTabPopstate(e) {
        var canProgramDetailsBeSeen = $(".program-fulldetails-page").is(
            ":visible"
        );
        console.log(
            "guide tab popstate",
            canProgramDetailsBeSeen
        );
        if (canProgramDetailsBeSeen) {
            closeProgramPageWithAnim("guidetab");
        }
    }

    function onLiveTabPopstate(e) {
        var canProgramDetailsBeSeen = $(".program-fulldetails-page").is(
            ":visible"
        );
        var canMiiverseViewBeSeen = $(".miiverse-modal").is(":visible");
        console.log(
            "live tab popstate",
            canProgramDetailsBeSeen,
            canMiiverseViewBeSeen
        );
        if (canProgramDetailsBeSeen) {
            closeProgramPageWithAnim("livetab");
        } else if (canMiiverseViewBeSeen) {
            closeMiiversePageWithAnim("livetab");
        }
    }

    initLiveTab();
}

window.addEventListener("load", function () {
    tvii.initialize();
});