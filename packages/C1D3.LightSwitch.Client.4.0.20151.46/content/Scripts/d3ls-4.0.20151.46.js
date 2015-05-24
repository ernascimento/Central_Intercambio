/*!
  D3 LightSwitch JavaScript Library v4.0.20151.46
  Copyright (C) GrapeCity, Inc. All rights reserved.
*/

(function (window, undefined) {

    "use strict";
    var d3ls = Object.create({});

    // treemap

    d3ls.treemap = function (element, contentItem, options) {

        function position() {
            this.style("left", function (d) { return d.x + "px"; })
                .style("top", function (d) { return d.y + "px"; })
                .style("width", function (d) { return Math.max(0, d.dx - 1) + "px"; })
                .style("height", function (d) { return Math.max(0, d.dy - 1) + "px"; });
        }

        function select(e, data) {
            if (contentItem.children.length > 0) {
                var tap = contentItem.children[0].properties.tap;
                contentItem.value.selectedItem = contentItem.value.data[data - 1];

                if (tap !== null && tap.canExecute) {
                    tap.execute();
                }
            }
        }

        if (options === undefined) {
            options = {};
        }

        if (typeof options.width !== "number") {
            options.width = 400;
        }

        if (typeof options.height !== "number") {
            options.height = 400;
        }

        if (typeof options.format !== "string") {
            options.format = ",d";
        }

        if (options.colors === undefined) {
            options.colors = d3.scale.category20c();
        }

        var name, value, tree = null;
        var format = d3.format(options.format);

        var style = "width:" + options.width + "px; height:" + options.height + "px;";
        $(element).first().attr("style", style);
        
        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];

            if (first.children.length > 1) {
                name = first.children[0].valueModel.name;
                value = first.children[1].valueModel.name;

                tree = d3.layout.treemap()
                    .size([options.width - 1, options.height - 1])
                    .sticky(false)
                    .value(function (d) { return Number(d[value]); });

                contentItem.value.oncollectionchange = function (args) {
                    if (args.detail.action !== "refresh") return;
                    d3.select($(element).first()[0]).selectAll(".d3-treenode").remove();

                    var root = {
                        name: "root",
                        children: contentItem.value.data
                    };

                    d3.select($(element).first()[0]).datum(root).selectAll(".d3-treenode")
                        .data(tree.nodes)
                        .enter().append("div")
                        .attr("class", "d3-treenode")
                        .attr("title", function (d) { return d[name] + ": " + format(Number(d[value])); })
                        .on("click", select)
                        .call(position)
                        .style("background", function (d) { return options.colors(d[name]); })
                        .append("div")
                        .attr("class", "d3-treetext")
                        .text(function (d) { return d[name]; });
                }

                c1ls.renderControl(contentItem);
            }
        }

        return tree;
    }
    
    // bubble chart

    d3ls.bubblechart = function (element, contentItem, options) {

        function select(e, data) {
            if (contentItem.children.length > 0) {
                var tap = contentItem.children[0].properties.tap;
                contentItem.value.selectedItem = contentItem.value.data[data];

                if (tap !== null && tap.canExecute) {
                    tap.execute();
                }
            }
        }

        if (options === undefined) {
            options = {};
        }

        if (typeof options.width !== "number") {
            options.width = 640;
        }

        if (typeof options.height !== "number") {
            options.height = 640;
        }

        if (typeof options.format !== "string") {
            options.format = ",d";
        }

        if (options.colors === undefined) {
            options.colors = d3.scale.category20c();
        }

        var name, value, bubble = null;
        var format = d3.format(options.format);

        var style = "width:" + options.width.toString() + "px; height:" + options.height.toString() + "px;";
        $(element).first().attr("style", style);

        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];

            if (first.children.length > 1) {
                name = first.children[0].valueModel.name;
                value = first.children[1].valueModel.name;

                var bubble = d3.layout.pack()
                    .sort(null)
                    .size([options.width, options.height])
                    .padding(1.5)
                    .value(function (d) { return Number(d[value]); });

                var svg = d3.select($(element).first()[0]).append("svg")
                    .attr("width", options.width)
                    .attr("height", options.height);

                contentItem.value.oncollectionchange = function (args) {
                    if (args.detail.action !== "refresh") return;
                    svg.selectAll(".d3-bubblenode").remove();

                    var root = {
                        children: contentItem.value.data
                    };

                    var node = svg.selectAll(".d3-bubblenode")
                        .data(bubble.nodes(root)
                        .filter(function (d) { return !d.children; }))
                        .enter().append("g")
                        .attr("class", "d3-bubblenode")
                        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

                    node.append("title")
                        .text(function (d) { return d[name] + ": " + format(Number(d[value])); });

                    node.append("circle")
                        .attr("r", function (d) { return d.r; })
                        .on("click", select)
                        .style("fill", function (d) { return options.colors(d[name]); });

                    node.append("text")
                        .attr("dy", ".3em")
                        .on("click", select)
                        .style("text-anchor", "middle")
                        .text(function (d) { return d[name]; });
                };

                c1ls.renderControl(contentItem);
            }
        }

        return bubble;
    }

    // heatmap

    d3ls.heatmap = function (element, contentItem, options) {

        function getUnique(data, name) {
            var hash = {};

            data.forEach(function (r) {
                hash[r[name]] = null;
            });

            return Object.keys(hash);
        }

        function select(e, data) {
            if (contentItem.children.length > 0) {
                var tap = contentItem.children[0].properties.tap;
                contentItem.value.selectedItem = contentItem.value.data[data];

                if (tap !== null && tap.canExecute) {
                    tap.execute();
                }
            }
        }

        if (options === undefined) {
            options = {};
        }

        if (typeof options.width !== "number") {
            options.width = 900;
        }

        if (typeof options.height !== "number") {
            options.height = 540;
        }

        if (typeof options.format !== "string") {
            options.format = ",d";
        }

        if (options.colors === undefined) {
            options.colors = colorbrewer.RdYlBu[9];
        }

        var style = "width:" + options.width.toString() + "px; height:" + options.height.toString() + "px;";
        $(element).first().attr("style", style);

        var format = d3.format(options.format);
        var margin = { top: 30, right: 0, bottom: 60, left: 120 };
        var width = options.width - margin.left - margin.right;
        var height = options.height - margin.top - margin.bottom;

        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];

            if (first.children.length > 2) {
                var rowField = first.children[0].valueModel.name;
                var colField = first.children[1].valueModel.name;
                var valField = first.children[2].valueModel.name;

                var svg = d3.select($(element).first()[0]).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                contentItem.value.oncollectionchange = function (args) {
                    if (args.detail.action !== "refresh") return;
                    svg.selectAll(".rowLabel").remove();
                    svg.selectAll(".colLabel").remove();
                    svg.selectAll(".heatData").remove();
                    svg.selectAll(".legend").remove();

                    var colorScale = d3.scale.quantile()
                        .domain([0, d3.max(contentItem.value.data, function (d) { return Number(d[valField]); })])
                        .range(options.colors);

                    var rowValues = getUnique(contentItem.value.data, rowField);
                    var colValues = getUnique(contentItem.value.data, colField);

                    var gridSize = Math.floor(width / colValues.length);
                    var legendElementWidth = Math.floor(width / 9);

                    var rowLabels = svg.selectAll(".rowLabel")
                        .data(rowValues)
                        .enter().append("text")
                          .text(function (d) { return d; })
                          .attr("x", 0)
                          .attr("y", function (d, i) { return i * gridSize; })
                          .style("text-anchor", "end")
                          .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
                          .attr("class", function (d, i) { return "rowLabel mono axis"; });

                    var colLabels = svg.selectAll(".colLabel")
                        .data(colValues)
                        .enter().append("text")
                          .text(function (d) { return d; })
                          .attr("x", function (d, i) { return i * gridSize; })
                          .attr("y", 0)
                          .style("text-anchor", "middle")
                          .attr("transform", "translate(" + gridSize / 2 + ", -6)")
                          .attr("class", function (d, i) { return "colLabel mono axis"; });

                    var heatMap = svg.selectAll(".heatData")
                        .data(contentItem.value.data)
                        .enter().append("rect")
                        .attr("x", function (d) { return colValues.indexOf(d[colField].toString()) * gridSize; })
                        .attr("y", function (d) { return rowValues.indexOf(d[rowField]) * gridSize; })
                        .attr("rx", 4)
                        .attr("ry", 4)
                        .attr("class", "hour bordered")
                        .attr("width", gridSize)
                        .attr("height", gridSize)
                        .on("click", select)
                        .style("fill", options.colors[0]);

                    heatMap.transition().duration(1000)
                        .style("fill", function (d) { return colorScale(Number(d[valField])); });

                    heatMap.append("title").text(function (d) { return format(Number(d[valField])); });

                    var legend = svg.selectAll(".legend")
                        .data([0].concat(colorScale.quantiles()), function (d) { return d; })
                        .enter().append("g")
                        .attr("class", "legend");

                    legend.append("rect")
                        .attr("x", function (d, i) { return legendElementWidth * i; })
                        .attr("y", height)
                        .attr("width", legendElementWidth)
                        .attr("height", gridSize / 2)
                        .style("fill", function (d, i) { return options.colors[i]; });

                    legend.append("text")
                        .attr("class", "mono")
                        .text(function (d) { return "> " + format(Math.round(d)); })
                        .attr("x", function (d, i) { return legendElementWidth * i; })
                        .attr("y", height + gridSize);
                }

                c1ls.renderControl(contentItem);
            }
        }
    }

    // timeline

    d3ls.timeline = function (element, contentItem, options) {

        function brushed() {
            focusX.domain(brush.empty() ? contextX.domain() : brush.extent());
            for (var n = 0; n < focusAreas.length; n++) {
                focus.select(".c1d3_" + n).attr("d", focusAreas[n]);
            }
            focus.select(".x.axis").call(focusAxisX);
        }

        if (options === undefined) {
            options = {};
        }

        if (typeof options.width !== "number") {
            options.width = 600;
        }

        if (typeof options.height !== "number") {
            options.height = 400;
        }
        
        if (typeof options.format !== "string") {
            options.format = ",d";
        }

        if (typeof options.axisWidth !== "number") {
            options.axisWidth = 25;
        }

        if (typeof options.axisHeight !== "number") {
            options.axisHeight = 20;
        }

        if (options.colors === undefined) {
            options.colors = d3.scale.category10();
        }

        var style = "width:" + options.width + "px; height:" + options.height + "px;";
        $(element).first().attr("style", style);

        var focusWidth = options.width - options.axisWidth;
        var focusHeight = (4 * options.height / 5) - (options.height / 10) - options.axisHeight;

        var focusX = d3.time.scale().range([0, focusWidth]);
        var focusY = d3.scale.linear().range([focusHeight, 0]);

        var contextWidth = options.width - options.axisWidth;
        var contextHeight = options.height / 5;

        var contextX = d3.time.scale().range([0, contextWidth]);
        var contextY = d3.scale.linear().range([contextHeight, 0]);

        var focusAxisX = d3.svg.axis().scale(focusX).orient("bottom");
        var focusAxisY = d3.svg.axis().scale(focusY).orient("left").tickFormat(d3.format(options.format));
        var contextAxisX = d3.svg.axis().scale(contextX).orient("bottom");

        var clipId = "clip" + new Date().getTime().toString();

        var brush = d3.svg.brush()
            .x(contextX)
            .on("brush", brushed);

        var svg = d3.select($(element).first()[0]).append("svg")
            .attr("width", options.width)
            .attr("height", options.height);

        svg.append("defs").append("clipPath")
            .attr("id", clipId)
          .append("rect")
            .attr("width", focusWidth)
            .attr("height", focusHeight);

        var focus = svg.append("g")
            .attr("transform", "translate(" + options.axisWidth + ",0)");

        var context = svg.append("g")
            .attr("transform", "translate(" + options.axisWidth + "," + (options.height - contextHeight - options.axisHeight).toString() + ")");

        var focusAreas = [];
        var contextAreas = [];
        var valFields = [];

        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];

            if (first.children.length > 1) {
                contentItem.value.oncollectionchange = function (args) {
                    if (args.detail.action !== "refresh") return;
                    svg.selectAll(".brush").call(brush.clear());
                    svg.selectAll("path").remove();
                    svg.selectAll(".axis").remove();

                    var timeField = first.children[0].valueModel.name;
    
                    for (var n = 1; n < first.children.length; n++) {
                        var name = first.children[n].valueModel.name;
                        valFields.push(name);
    
                        var area1 = d3.svg.area()
                            .interpolate("monotone")
                            .x(function (d) { return focusX(d[timeField]); })
                            .y0(focusHeight)
                            .y1(function (d) { return focusY(Number(d[this.attributes["tag"].value])); });
    
                        focusAreas.push(area1);
    
                        var area2 = d3.svg.area()
                            .interpolate("monotone")
                            .x(function (d) { return contextX(d[timeField]); })
                            .y0(contextHeight)
                            .y1(function (d) { return contextY(Number(d[this.attributes["tag"].value])); });
    
                        contextAreas.push(area2);
                    }

                    var data = contentItem.value.data;
                    focusX.domain(d3.extent(data.map(function (d) { return d[timeField]; })));
                    contextX.domain(focusX.domain());

                    for (var n = 0; n < valFields.length; n++) {
                        var name = valFields[n];

                        if (n === 0) {
                            focusY.domain([0, d3.max(data.map(function (d) { return Number(d[name]); }))]);
                            contextY.domain(focusY.domain());
                        }

                        focus.append("path")
                            .datum(data)
                            .attr("clip-path", "url(#" + clipId + ")")
                            .attr("class", "c1d3_" + n)
                            .attr("style", "fill:" + options.colors(name))
                            .attr("tag", valFields[n])
                            .attr("d", focusAreas[n]);

                        context.append("path")
                            .datum(data)
                            .attr("class", "c1d3_" + n)
                            .attr("style", "fill:" + options.colors(name))
                            .attr("tag", valFields[n])
                            .attr("d", contextAreas[n]);
                    }

                    focus.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + focusHeight + ")")
                        .call(focusAxisX);

                    focus.append("g")
                        .attr("class", "y axis")
                        .call(focusAxisY);

                    context.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + contextHeight + ")")
                        .call(contextAxisX);

                    context.append("g")
                        .attr("class", "x brush")
                        .call(brush)
                      .selectAll("rect")
                        .attr("y", -6)
                        .attr("height", contextHeight + 7);
                }

                c1ls.renderControl(contentItem);
            }
        }
    }

    // gantt chart

    d3ls.gantt = function (element, contentItem, options) {

        var timeDomainStart = d3.time.day.offset(new Date(), -3);
        var timeDomainEnd = d3.time.hour.offset(new Date(), +3);

        function initTimeDomain(tasks) {
            if (tasks === undefined || tasks.length < 1) {
                timeDomainStart = d3.time.day.offset(new Date(), -3);
                timeDomainEnd = d3.time.hour.offset(new Date(), +3);
                return;
            }
            tasks.sort(function (a, b) {
                return a[endTime] - b[endTime];
            });
            timeDomainEnd = tasks[tasks.length - 1][endTime];
            tasks.sort(function (a, b) {
                return a[startTime] - b[startTime];
            });
            timeDomainStart = tasks[0][startTime];
        }

        function initAxis() {
            x = d3.time.scale().domain([timeDomainStart, timeDomainEnd]).range([0, options.width - options.axisWidth]).clamp(true);
            y = d3.scale.ordinal().domain(taskTypes).rangeRoundBands([0, options.height - options.axisHeight], .1);
            xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format(options.format)).tickSubdivide(true).tickSize(8).tickPadding(8);
            yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);
        }

        var rectTransform = function (d) {
            return "translate(" + x(d[startTime]) + "," + y(d[taskName]) + ")";
        };

        function select(e, data) {
            if (contentItem.children.length > 0) {
                var tap = contentItem.children[0].properties.tap;
                contentItem.value.selectedItem = contentItem.value.data[data];

                if (tap !== null && tap.canExecute) {
                    tap.execute();
                }
            }
        }

        if (options === undefined) {
            options = {};
        }

        if (typeof options.width !== "number") {
            options.width = 600;
        }

        if (typeof options.height !== "number") {
            options.height = 400;
        }

        if (typeof options.format !== "string") {
            options.format = "%H:%M";
        }

        if (typeof options.axisWidth !== "number") {
            options.axisWidth = 100;
        }

        if (typeof options.axisHeight !== "number") {
            options.axisHeight = 40;
        }

        if (options.colors === undefined) {
            options.colors = d3.scale.category20c();
        }

        var taskName, startTime, endTime, x, y;
        var format = d3.format(options.format);
        var taskTypes = [];
        var xAxis, yAxis;

        var style = "width:" + options.width + "px; height:" + options.height + "px;";
        $(element).first().attr("style", style);

        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];

            if (first.children.length > 2) {
                startTime = first.children[0].valueModel.name;
                endTime = first.children[1].valueModel.name;
                taskName = first.children[2].valueModel.name;

                var svg = d3.select($(element).first()[0]).append("svg")
                    .attr("class", "chart")
                    .attr("width", options.width)
                    .attr("height", options.height)
                    .append("g")
                    .attr("transform", "translate(" + options.axisWidth + ", 0)");

                contentItem.value.oncollectionchange = function (args) {
                    if (args.detail.action !== "refresh") return;
                    svg.selectAll("rect").remove();
                    svg.selectAll(".axis").remove();
                    
                    taskTypes = contentItem.value.data.map(function (d) { return d[taskName]; });
                    taskTypes = taskTypes.reverse();
                    initTimeDomain(contentItem.value.data);
                    initAxis();

                    svg.selectAll(".chart")
                        .data(contentItem.value.data).enter()
                        .append("rect")
                        .attr("rx", 5)
                        .attr("ry", 5)
                        .attr("y", 0)
                        .attr("transform", rectTransform)
                        .attr("height", function (d) { return y.rangeBand(); })
                        .attr("width", function (d) {
                            return (x(d[endTime]) - x(d[startTime]));
                        })
                        .on("click", select)
                        .style("fill", function (d) { return options.colors(d[taskName]); });

                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0, " + (options.height - options.axisHeight) + ")")
                        .transition()
                        .call(xAxis);

                    svg.append("g").attr("class", "y axis").transition().call(yAxis);
                }

                c1ls.renderControl(contentItem);
            }
        }
    }

    // d3ls

    if (!window.d3ls) {
        window.d3ls = d3ls;
    }

})(window);
