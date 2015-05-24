/// <reference path="https://platform.twitter.com/widgets.js" />
/// <reference path="http://code.jquery.com/jquery-2.1.0.js" />

var TwitterControl = (function () {
    "use strict";

    function isTwitterApiLoaded() {
        return typeof twttr !== 'undefined';
    }

    var twitterCustomizations = [
        { name: "userId", dataName: "data-screen-name" },
        { name: "theme", dataName: "data-theme" },
        { name: "linkColor", dataName: "data-link-color" },
        { name: "width", dataName: "width" },
        { name: "height", dataName: "height" },
        { name: "chrome", dataName: "data-chrome" },
        { name: "borderColor", dataName: "data-border-color" },
        { name: "language", dataName: "lang" },
        { name: "tweetLimit", dataName: "data-tweet-limit" },
        { name: "related", dataName: "data-related" },
        { name: "ariaPolite", dataName: "data-aria-polite" },
        { name: "showReplies", dataName: "data-show-replies" },
        { name: "customTimelineId", dataName: "data-custom-timeline-id" },
        { name: "favoritesId", dataName: "data-favorites-screen-name" },
        { name: "listOwnerId", dataName: "data-list-owner-screen-name" },
        { name: "listId", dataName: "data-list-id" },
    ];

    function ControlData() {
        /// <field name="widgetId" type="msls.ContentItem" />
        /// <field name="userId" type="msls.ContentItem" />
        /// <field name="theme" type="msls.ContentItem" />
        /// <field name="linkColor" type="msls.ContentItem" />
        /// <field name="width" type="msls.ContentItem" />
        /// <field name="height" type="msls.ContentItem" />
        /// <field name="chrome" type="msls.ContentItem" />
        /// <field name="borderColor" type="msls.ContentItem" />
        /// <field name="language" type="msls.ContentItem" />
        /// <field name="tweetLimit" type="msls.ContentItem" />
        /// <field name="related" type="msls.ContentItem" />
        /// <field name="ariaPolite" type="msls.ContentItem" />
        /// <field name="showReplies" type="msls.ContentItem" />
        /// <field name="customTimelineId" type="msls.ContentItem" />
        /// <field name="favoritesId" type="msls.ContentItem" />
        /// <field name="listOwnerId" type="msls.ContentItem" />
        /// <field name="listId" type="msls.ContentItem" />
    }
    ControlData.prototype.bindToStringValues = function (callback) {
        for (var property in this) {
            if (this.hasOwnProperty(property)) {
                var propertyValue = this[property];
                if (propertyValue && typeof propertyValue.dataBind === 'function') {
                    propertyValue.dataBind('stringValue', callback);
                }
            }
        }
    };

    function FakeContentItem(value) {
        /// <param name="value" type="Object" />
        if (value) {
            if (typeof value === 'string') {
                this.stringValue = value;
            }
            else {
                this.stringValue = value.toString();
            }
        }
    }

    function rebuildTwitterFeed(target, data) {
        /// <summary>
        /// Rebuilds the twitter feed by tearing out the old one and adds a new
        /// anchor.  Calling twttr.widgets.load will convert the anchor into the
        /// correct twitter feed UI.
        /// </summary>
        /// <param name="target" type="jQuery" />
        /// <param name="data" type="ControlData" />
        /// <remarks>
        /// Rebuilding the control is needed every time because the anchor tag is removed by Twitter
        /// during twttr.widgets.load and replaced with an iframe.
        /// </remarks>

        if (isTwitterApiLoaded() && target) {
            // remove the previous feed
            target.empty();

            if (data && data.widgetId && data.widgetId.stringValue) {
                var feed = $(document.createElement("a"));
                feed.addClass("twitter-timeline");
                feed.attr({
                    'data-dnt': "true",
                    'data-widget-id': data.widgetId.stringValue
                });

                for (var i in twitterCustomizations) {
                    var name = twitterCustomizations[i].name,
                        dataName = twitterCustomizations[i].dataName,
                        contentItem = data[name];
                    if (contentItem && contentItem.stringValue) {
                        feed.attr(dataName, contentItem.stringValue);
                    }
                }
            }

            target.append(feed);
            twttr.widgets.load(target.get(0));
        }
    }

    var TwitterControl = {};
    TwitterControl.render = function (element, contentItem, options) {
        /// <param name="element" type="Element" />
        /// <param name="contentItem" type="msls.ContentItem" />
        /// <param name="options">
        /// An optional object that contains static values to use:
        ///  widgetId
        ///  userId
        ///  theme
        ///  linkColor
        ///  width
        ///  height
        ///  chrome
        ///  borderColor
        ///  language
        ///  tweetLimit
        ///  related
        ///  ariaPolite
        ///  showReplies
        ///  customTimelineId
        ///  favoritesId
        ///  listOwnerId
        ///  listId
        /// </param>

        var target = $(element),
            controlData = new ControlData(),
            isFeedLoading = false;

        setTimeout(function () {
            target.removeClass("ui-disabled");
        });

        // find the child ContentItem based on a naming convention
        contentItem.children.forEach(function (e) {
            var name = e.name.toLowerCase();

            for (var i in twitterCustomizations) {
                var customizationName = twitterCustomizations[i].name;
                if (name.indexOf(customizationName.toLowerCase()) >= 0) {
                    controlData[customizationName] = e;
                    break;
                }
            }
        });

        if (options) {
            // if any of the optional properties are specified, use that value instead of a child ContentItem
            for (var property in options) {
                if (options.hasOwnProperty(property)) {
                    var propertyValue = options[property];
                    if (propertyValue) {
                        controlData[property] = new FakeContentItem(propertyValue);
                    }
                }
            }
        }

        function loadFeed() {
            if (!isFeedLoading) {
                isFeedLoading = true;
                if (!isTwitterApiLoaded()) {
                    $.getScript("https://platform.twitter.com/widgets.js", function () {
                        rebuildTwitterFeed(target, controlData);
                        isFeedLoading = false;
                    });
                }
                else {
                    setTimeout(function () {
                        rebuildTwitterFeed(target, controlData);
                        isFeedLoading = false;
                    });
                }
            }
        }

        controlData.bindToStringValues(loadFeed);

        if (controlData.widgetId && controlData.widgetId.stringValue) {
            // ensure the feed is loaded
            loadFeed();
        }
    };

    return TwitterControl;
})();
