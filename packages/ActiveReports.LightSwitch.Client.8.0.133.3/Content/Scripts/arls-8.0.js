/*!
  ActiveReports LightSwitch JavaScript Library v8.0
  Copyright (C) GrapeCity, Inc. All rights reserved.
*/

(function (window, undefined) {

    "use strict";
    var arls = Object.create({});

    function runtimeVersion() {
        var v = 2.0;
        Object.keys(msls.application.options).map(function (key) {
            if (key === "defaultMergeOption") {
                v = 2.5;
            }
        });
        return v;
    }

    arls.adjustScroll = function (element) {

        function applyOffsets() {
            var page = $(element).parents("[data-role='page']");
            var header = page.children().first();
            var offset = header.height();
            var div1 = header.next();
            var div2 = div1.children().first();
            var div3 = div2.children().first();
            div1.height(div1.height() - offset);
            div2.height(div2.height() - offset);
            div3.height(div3.height() - offset);
        }

        if (runtimeVersion() === 2.5) {
            applyOffsets();

            $(window).resize(function () {
                setTimeout(applyOffsets, 100);
            });
        }
    };

    if (!window.arls) {
        window.arls = arls;
    }

})(window);
