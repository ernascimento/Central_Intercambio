/*!
  Wijmo LightSwitch JavaScript Library v4.0.20151.46
  Copyright (C) GrapeCity, Inc. All rights reserved.
*/

(function (window, undefined) {

    "use strict";
    var c1ls = Object.create({});

    // Constants

    c1ls.fontFamily = "Segoe UI, Segoe WP, Roboto, Frutiger, Helvetica Neue, Helvetica, Arial, sans-serif";

    // ContentItem

    c1ls.getFirstItem = function (contentItem) {

        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];
            return first.children[0].valueModel.name;
        }

        return null;
    };

    c1ls.isNullableType = function (contentItem) {

        var n = contentItem.valueModel.propertyType.__isNullableType;
        return n === undefined ? false : n !== 0;
    };

    c1ls.isImageType = function (contentItem) {

        var t = contentItem.valueModel.propertyType;
        t = c1ls.isNullableType(contentItem) ? t.underlyingType : t;
        return t.id === ":Binary" || t.id === "Microsoft.LightSwitch.Extensions:Image";
    }

    c1ls.getTypeDesc = function (contentItem) {

        function isPrimitiveType(t) {
            var p = t.__isPrimitiveType;
            return p === undefined ? false : p !== 0;
        }

        var t = contentItem.valueModel.propertyType;
        var f = undefined;

        while (!isPrimitiveType(t)) {
            t = t.underlyingType;
        }

        if (t.name === "Int16" || t.name === "Int32" || t.name === "Int64") {
            f = "n0";
        }

        var j = (t.name === "Decimal") ? "number" : t.jSType.toLowerCase();

        if (j === "date") {
            j = "datetime";
        }

        return {
            type: j,
            format: f,
            underlying: t.name
        };
    };

    c1ls.loadMore = function (contentItem, callback) {

        if (contentItem.value.canLoadMore) {
            msls.showProgress(msls.promiseOperation(function (op) {
                contentItem.value.loadMore().then(
                    function (result) { op.complete(result); },
                    function (error) { op.error(error); }
                );
            }).then(function success(result) {
                if ($.isFunction(callback)) {
                    callback(result);
                }
            }, function failure(error) {
            }));
        }
    }

    c1ls.renderControl = function (contentItem) {

        if (contentItem.value.isLoaded) {
            var args = {
                detail: { action: "refresh" },
                target: contentItem.value,
                type: "collectionchange"
            };
            if (contentItem.parent.kind === "Popup") {
                contentItem.value.oncollectionchange(args);
            }
            else {
                setTimeout(function () {
                    contentItem.value.oncollectionchange(args);
                }, 500);
            }
        }
    }

    // wijgrid

    c1ls.getGridContent = function (table, contentItem, options) {

        function wijgridGetColumns(contentItem) {

            var cols = [];

            function imageFormatter(args) {
                if (args.row.type & wijmo.grid.rowType.data) {
                    if (args.formattedValue !== "") {
                        args.formattedValue = "<img style='text-align:center' src='data:image;base64," + args.formattedValue + "'>";
                        args.$container.parent().addClass("wijalign-center");
                    }
                }
            }

            if (contentItem.children.length > 0) {
                var first = contentItem.children[0];

                var createColumn = function (c) {
                    if (c.isVisible) {
                        if (c.kind === "Details") {
                            var m = this.slice(0); 
                            m.push(c.valueModel.name);
                            if (c.children.length > 1) {
                                c.children.forEach(createColumn, m);
                            }
                            else {
                                var summary = c.valueModel.elementType[":@SummaryProperty"].property.name;
                                cols.push({
                                    headerText: c.displayName,
                                    key: summary,
                                    context: m,
                                    readOnly: true
                                });
                            }
                        }
                        else if (c.kind === "Value") {
                            if (c1ls.isImageType(c)) {
                                cols.push({
                                    cellFormatter: imageFormatter,
                                    headerText: c.displayName,
                                    key: c.valueModel.name,
                                    dataType: "string",
                                    readOnly: true
                                });
                            }
                            else {
                                var t = c1ls.getTypeDesc(c);
                                if (t.type !== "array") {
                                    cols.push({
                                        headerText: c.displayName,
                                        key: c.valueModel.name,
                                        context: this,
                                        dataType: t.type,
                                        dataFormatString: t.format,
                                        underlyingType: t.underlying,
                                        readOnly: this.length > 0
                                    });
                                }
                            }
                        }
                    }
                };

                first.children.forEach(createColumn, []);
            }

            return cols;
        }

        function wijgridGetDataRow(columns, value) {

            var row = [];

            columns.forEach(function (c) {
                var v = value;

                if (!!v && c.context !== undefined) {
                    var m = c.context.slice(0);
                    while (m.length > 0) {
                        v = v[m.shift()];
                    }
                }

                if (!!v && v[c.key] !== undefined) {
                    if (c.dataType === "number") {
                        row.push(Number(v[c.key]));
                    }
                    else {
                        row.push(v[c.key]);
                    }
                }
                else {
                    row.push(null);
                }
            });

            if ($.isFunction(me.RowMapper)) {
                return me.RowMapper(row);
            }

            return row;
        }

        contentItem.proxyValue = {
            data: contentItem.value.data,
            baseQuery: contentItem.value._loader._baseQuery,
            query: undefined,
            count: 0,
            totalCount: 0,
            busy: false,
            clientArgs: false,
            reloading: false
        };

        var cols = wijgridGetColumns(contentItem);

        var rows = function () {
            if (typeof startIndex === "number") {
                var pageSize = contentItem.valueModel.pageSize;

                return contentItem.proxyValue.data.slice(startIndex, startIndex + pageSize).map(function (r) {
                    return wijgridGetDataRow(cols, r);
                });
            }
            else {
                return contentItem.proxyValue.data.map(function (r) {
                    return wijgridGetDataRow(cols, r);
                });
            }
        };

        var selected = function (index) {
            return contentItem.proxyValue.data[index];
        };

        function refresh(clear) {
            if (clear) {
                table.wijgrid("selection").clear();
                contentItem.value.selectedItem = null;
            }
            table.wijgrid("option", "data", rows());
            setTimeout(function () {
                if (table.is(":visible")) {
                    table.wijgrid("endEdit");
                }
            }, 100);
        }

        function executeQuery() {

            var proxy = contentItem.proxyValue;
            var query = proxy.baseQuery;

            proxy.clientArgs = false;

            $.each(table.wijgrid("columns"), function (index, column) {
                var key = _getColumnKey(column.options);
                var dir = column.options.sortDirection;

                if (dir === "ascending") {
                    query = query.orderBy(key);
                    proxy.clientArgs = true;
                }
                else if (dir === "descending") {
                    query = query.orderByDescending(key);
                    proxy.clientArgs = true;
                }
            });

            $.each(table.wijgrid("columns"), function (index, column) {
                var expr, op = column.options.filterOperator;
                op = op ? op.toLowerCase() : undefined;

                if (op !== "nofilter") {
                    var key = _getColumnKey(column.options);
                    var value = _getColumnFilterValue(column.options);

                    if (op === "equals") {
                        expr = key + " eq " + value;
                    }
                    else if (op === "notequals") {
                        expr = key + " ne " + value;
                    }
                    else if (op === "greater") {
                        expr = key + " gt " + value;
                    }
                    else if (op === "greaterorequal") {
                        expr = key + " ge " + value;
                    }
                    else if (op === "less") {
                        expr = key + " lt " + value;
                    }
                    else if (op === "lessorequal") {
                        expr = key + " le " + value;
                    }
                    else if (op === "isempty") {
                        expr = key + " eq ''";
                    }
                    else if (op === "isnull") {
                        expr = key + " eq null";
                    }
                    else if (op === "notisempty") {
                        expr = key + " ne ''";
                    }
                    else if (op === "notisnull") {
                        expr = key + " ne null";
                    }
                    else if (op === "beginswith") {
                        expr = "startswith(" + key + ", " + value + ")";
                    }
                    else if (op === "endswith") {
                        expr = "endswith(" + key + ", " + value + ")";
                    }
                    else if (op === "contains") {
                        expr = "indexof(" + key + ", " + value + ") ge 0";
                    }
                }

                if (expr !== undefined) {
                    query = query.filter(expr);
                    proxy.clientArgs = true;
                }
            });

            if (!contentItem.valueModel.disablePaging) {
                query = query.top(contentItem.valueModel.pageSize);
            }

            query = query.includeTotalCount();

            proxy.count = 0;
            proxy.totalCount = 0;
            proxy.busy = true;
            proxy.query = query;

            startIndex = undefined;

            if (prevCmd !== undefined) {
                prevCmd.isEnabled = false;
            }

            if (nextCmd !== undefined) {
                nextCmd.isEnabled = false;
            }

            msls.showProgress(msls.promiseOperation(function (op) {
                query.execute().then(
                    function (result) { op.complete(result); },
                    function (error) { op.error(error); }
                );
            }).then(function success(data) {
                proxy.data = data.results;
                proxy.count += data.results.length;
                proxy.totalCount = data.totalCount;
                if (nextCmd !== undefined) {
                    nextCmd.isEnabled = (proxy.count < proxy.totalCount);
                }
                else {
                    newRows.map(function (r) {
                        proxy.data.unshift(r);
                    });
                }
                if (!proxy.clientArgs) {
                    proxy.query = undefined;
                }
                refresh(true);
                proxy.busy = proxy.reloading = false;
            }, function failure(error) {
                proxy.busy = proxy.reloading = false;
                msls.showMessageBox(error, { title: "Error" });
            }));
        }

        function _getColumnKey(column) {
            if (column.context !== undefined && column.context.length > 0) {
                return column.context.join("/") + "/" + column.key;
            }
            else {
                return column.key;
            }
        }

        function _getColumnFilterValue(column) {
            var value = column.filterValue;
            if (column.dataType === "string" || column.dataType === undefined) {
                value = msls._toODataString(value, "String");
            }
            else if (column.dataType === "datetime") {
                value = msls._toODataString(value, column.underlyingType);
            }
            return value;
        }

        var sort = function (e, args) {
            $.each(table.wijgrid("columns"), function (index, column) {
                column.options.sortDirection = "none";
            });
            args.column.sortDirection = args.sortDirection;
            executeQuery();
            table.wijgrid("ensureControl", false);
            return false;
        };

        var filter = function (e, args) {
            args.column.filterOperator = args.operator;
            args.column.filterValue = args.value;
            executeQuery();
            table.wijgrid("ensureControl", false);
            return false;
        };

        var rowHeader = false, cellClick = null, cellFormat = null, rowEntity = null;

        function selectRow(args) {
            var view = table.wijgrid("dataView").real;
            var offset = (typeof startIndex === "number") ? startIndex : 0;
            var rowIndex = args.cell.row() !== null ? args.cell.row().dataRowIndex : args.cell.rowIndex();

            if (rowIndex >= 0) {
                var index = view.sourceArray.indexOf(view.local[rowIndex]);
                var item = selected(offset + index);

                if (item === contentItem.value.selectedItem) {
                    return true;
                }

                contentItem.value.selectedItem = item;
            }
            return false;
        }

        var autoHide = true;

        if (options !== undefined) {
            if (options.autoHide !== undefined) {
                autoHide = !!options.autoHide;
            }
        }

        var tapOptions = {
            beforeShown: function (screen) {
                if (autoHide) {
                    table.hide();
                }
                if (userTapOptions.beforeShown) {
                    userTapOptions.beforeShown(screen);
                }
             },
             afterClosed: function (screen, action) {
                 checkResize(false);
                 if (action === msls.NavigateBackAction.commit) {
                     notifyHandler(msls.EntityState.modified);
                 }
                 if (userTapOptions.afterClosed) {
                     userTapOptions.afterClosed(screen, action);
                 }
             }
        };

        var userTapOptions = {
            beforeShown: null,
            afterClosed: null
        };

        var newRows = [];

        function notifyHandler(state) {
            var proxy = contentItem.proxyValue;

            function doRefresh(r) {
                if (proxy.query === undefined) {
                    proxy.data = contentItem.value.data;
                }

                if (proxy.data.indexOf(contentItem.value.selectedItem) >= 0) {
                    refresh();
                    if (r !== -1) {
                        table.wijgrid("selection").addRows(r);
                    }
                }
                else if (nextCmd !== undefined && proxy.clientArgs) {
                    refresh();
                }
                else {
                    newRows.push(contentItem.value.selectedItem);
                    proxy.data.unshift(contentItem.value.selectedItem);
                    refresh();
                }
            }

            if (state === msls.EntityState.added) {
                if (prevCmd !== undefined) {
                    prevCmd.isEnabled = false;
                }

                if (nextCmd !== undefined) {
                    var pageSize = contentItem.valueModel.pageSize;

                    if (proxy.query === undefined) {
                        nextCmd.isEnabled = (pageSize < contentItem.value.data.length) || contentItem.value.canLoadMore;
                    }
                    else {
                        if (!proxy.clientArgs) {
                            proxy.totalCount++;
                        }
                        nextCmd.isEnabled = pageSize < proxy.totalCount;
                    }

                    if (typeof startIndex === "number") {
                        startIndex = 0;
                    }
                }

                doRefresh(0);
            }

            else if (state === msls.EntityState.deleted || state === msls.EntityState.modified) {
                var r = table.wijgrid("currentCell").rowIndex();
                doRefresh(r);
            }

            else if (state === msls.EntityState.discarded) {
                contentItem.value.selectedItem.deleteEntity();
            }
        }

        function reloadIfDirty(args) {
            var details, base = contentItem.proxyValue.baseQuery;
            if (!base) return;

            if (base.dataService) {
                details = base.dataService.details;
            }
            else if (base._entitySet.dataService) {
                details = base._entitySet.dataService.details;
            }
            
            function changesReady() {
                if (table.is(":visible")) {
                    executeQuery();
                    table.wijgrid("ensureControl", false);
                }
                details.removeChangeListener("hasChanges", changesReady);
            }

            if (details && details.hasChanges) {
                newRows = [];
                contentItem.proxyValue.reloading = true;
                details.addChangeListener("hasChanges", changesReady);
            }
        }

        var saveCommand = $("[data-ls-tap='tap:{data.shell.saveCommand.command}']");
        saveCommand.click(reloadIfDirty);

        var discardCommand = $("[data-ls-tap='tap:{data.shell.discardCommand.command}']");
        discardCommand.click(reloadIfDirty);

        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];

            if (first.properties.tap !== null) {
                rowHeader = true;
                var method = first.properties.tap.___method;

                var wrapper = function (entity, options) {
                    if (options !== undefined) {
                        userTapOptions.beforeShown = options.beforeShown;
                        userTapOptions.afterClosed = options.afterClosed;
                    }
                    method(entity, tapOptions);
                }

                if (first.properties.tap._boundArguments) {
                    first.properties.tap.___method = wrapper;
                }

                cellClick = function (e, args) {
                    var again = selectRow(args);
                    var single = table.data().wijmoWijgrid.options.selectionMode === "singleRow";
                    var inline = table.data().wijmoWijgrid.options.editingMode === "cell";

                    if ((again && single) || (args.cell.column() === null && args.cell.rowIndex() >= 0)) {
                        var tap = contentItem.children[0].properties.tap;

                        if (!inline && tap.canExecute) {
                            tap.execute();
                        }
                    }
                };
            }
            else {
                cellClick = function (e, args) {
                    selectRow(args);
                };
            }

            rowEntity = function (rowIndex) {
                var view = table.wijgrid("dataView").real;
                var offset = (typeof startIndex === "number") ? startIndex : 0;
                var index = view.sourceArray.indexOf(view.local[rowIndex]);
                var row = contentItem.proxyValue.data[index + offset];
                return !!row ? row.details._ : null;
            }

            cellFormat = function (args) {
                if (args.column === null && args.row.dataRowIndex >= 0) {
                    if (first.properties.tap !== null) {    
                        args.$cell.css("cursor", "pointer");
                    }

                    if (args.$cell[0].className.indexOf("wijmo-wijgrid-rowheader") != -1) {
                        var obj = rowEntity(args.row.dataRowIndex);
                        var state = !!obj ? obj.__entityState : null;
                        var icon = undefined;

                        if (state === "modified") {
                            icon = "edit";
                        }
                        else if (state === "deleted" || state === "discarded" || state === null) {
                            icon = "delete";
                        }
                        else if (state === "added") {
                            icon = "plus";
                        }

                        if (icon !== undefined) {
                            args.$cell.children(".wijmo-wijgrid-innercell").addClass("wijgrid-rowheader-icon ui-icon-" + icon);
                        }
                    }
                }
            };
        }

        var more = function (callback) {
            var proxy = contentItem.proxyValue;

            if (proxy.query !== undefined) {
                if (proxy.count < proxy.totalCount) {
                    proxy.busy = true;
                    proxy.query = proxy.query.skip(proxy.count);

                    msls.showProgress(msls.promiseOperation(function (op) {
                        proxy.query.execute().then(
                            function (result) { op.complete(result); },
                            function (error) { op.error(error); }
                        );
                    }).then(function success(data) {
                        proxy.data = proxy.data.concat(data.results);
                        proxy.count += data.results.length;
                        proxy.totalCount = data.totalCount;
                        proxy.busy = false;

                        if ($.isFunction(callback)) {
                            callback(data);
                        }
                    }, function failure(error) {
                    }));
                }
            }

            else {
                c1ls.loadMore(contentItem, callback);
            }
        };

        var startIndex, nextCmd, prevCmd;

        var next = function () {
            var proxy = contentItem.proxyValue;
            var pageSize = contentItem.valueModel.pageSize;
            var length = (proxy.query !== undefined) ? proxy.totalCount : contentItem.value.data.length;
            var enable = (proxy.query !== undefined) ? false : contentItem.value.canLoadMore;

            if (typeof startIndex === "number") {
                if (!contentItem.value.canLoadMore || (startIndex + pageSize < length)) {
                    if (startIndex + pageSize < proxy.data.length) {
                        startIndex += pageSize;
                        prevCmd.isEnabled = true;
                        nextCmd.isEnabled = (startIndex + pageSize < length) || enable;
                        refresh(true);
                        return;
                    }
                }
            }
            else if (proxy.query === undefined && !contentItem.value.canLoadMore) {
                startIndex = pageSize;
                prevCmd.isEnabled = true;
                nextCmd.isEnabled = (startIndex + pageSize < length);
                if (proxy.data.length < length) {
                    proxy.data = contentItem.value.data;
                }
                refresh(true);
                return;
            }

            more(function (data) {
                prevCmd.isEnabled = true;

                // msls 2.0 requires extra "next" click before canLoadMore becomes false
                // msls 1.x does not have a refresh method, so this will not execute
                if (!contentItem.value.canLoadMore && $.isFunction(contentItem.value.refresh)) {
                    var length = (proxy.query !== undefined) ? proxy.totalCount : contentItem.value.data.length;
                    if (typeof startIndex === "number" && startIndex + pageSize >= length) {
                        nextCmd.isEnabled = false;
                        return;
                    }
                }

                if (typeof startIndex === "number") {
                    startIndex += pageSize;
                }
                else {
                    startIndex = pageSize;
                }

                if (proxy.query !== undefined) {
                    if (proxy.totalCount === 0 && !contentItem.value.canLoadMore) {
                        proxy.totalCount = proxy.data.length;
                    }

                    if (proxy.totalCount > 0 && proxy.data.length >= proxy.totalCount) {
                        nextCmd.isEnabled = false;
                    }
                }
                else {
                    nextCmd.isEnabled = (startIndex + pageSize < contentItem.value.data.length) || contentItem.value.canLoadMore;
                    contentItem.proxyValue.data = contentItem.value.data;
                }

                refresh(true);
            });
        }

        var previous = function () {
            if (typeof startIndex === "number") {
                var pageSize = contentItem.valueModel.pageSize;
                startIndex -= pageSize;
                nextCmd.isEnabled = true;
                prevCmd.isEnabled = startIndex > 0;
                refresh(true);
            }
        }

        var scrolling = true;

        if (options !== undefined) {
            if (typeof options.previous === "string") {
                prevCmd = contentItem.screen.findContentItem(options.previous);

                if (prevCmd !== undefined) {
                    prevCmd.isEnabled = false;
                }
            }

            if (typeof options.next === "string") {
                nextCmd = contentItem.screen.findContentItem(options.next);

                if (nextCmd !== undefined) {
                    scrolling = false;
                    nextCmd.isEnabled = contentItem.value.canLoadMore;

                    contentItem.value.onchange = function (arg) {
                        if (arg.detail === "canLoadMore") {
                            nextCmd.isEnabled = contentItem.value.canLoadMore;
                        }
                    };

                    contentItem.value.oncollectionchange = function (arg) {
                        if (arg.detail.action === "refresh") {
                            contentItem.proxyValue = {
                                data: contentItem.value.data,
                                baseQuery: contentItem.value._loader._baseQuery,
                                query: undefined,
                                count: 0,
                                totalCount: 0,
                                busy: false,
                                clientArgs: false,
                                reloading: false
                            };

                            startIndex = undefined;

                            if (prevCmd !== undefined) {
                                prevCmd.isEnabled = false;
                            }
                        }

                        var pageSize = contentItem.valueModel.pageSize;
                        var offset = (typeof startIndex === "number") ? startIndex : 0;
                        nextCmd.isEnabled = (offset + pageSize < contentItem.value.data.length) || contentItem.value.canLoadMore;
                        refresh(true);

                        if (!table.is(":visible")) {
                            table.data("c1lsNeedResize", true);
                        }
                    };
                }
            }
        }

        if (scrolling) {
            var scroll = table.closest(".msls-vscroll");
            scroll = scroll.length ? scroll : $(window);

            scroll.on("scroll", function () {
                if (table.is(":visible") && contentItem.value !== null && contentItem.value.state === "idle" && !contentItem.proxyValue.busy) {
                    var needMore = table.height() - scroll.scrollTop() < 2 * scroll.height();
                    if (needMore) {
                        more(function (data) {
                            if (contentItem.proxyValue.query === undefined) {
                                contentItem.proxyValue.data = contentItem.value.data;
                            }
                            refresh();
                        });
                    }
                }
            });

            contentItem.value.oncollectionchange = function (args) {
                if (args.detail.action !== "add" && !contentItem.proxyValue.reloading) {
                    contentItem.proxyValue.data = contentItem.value.data;
                    refresh();
                    if (!table.is(":visible")) {
                        table.data("c1lsNeedResize", true);
                    }
                }
            };
        }

        var cellUpdate = function (e, args) {
            var row = table.wijgrid("currentCell").row();
            var selected = contentItem.value.selectedItem;
            var dirty = false;
            var column = args.cell.column();

            if (!column.readOnly && column.context.length === 0) {
                var key = column.key;
                var value = row.data[column.dataIndex];
                if (selected[key] !== value) {
                    selected[key] = value;
                    dirty = true;
                }
            }

            if (dirty || selected.details._.__hasEdits) {
                var state = selected.details._.__entityState;

                if (state === undefined || state === "modified") {
                    $(args.cell.tableCell()).siblings(".wijmo-wijgrid-rowheader").children(".wijmo-wijgrid-innercell").addClass("wijgrid-rowheader-icon ui-icon-edit");
                }
            }
        }

        var cellChange = function (e, args) {
            if (table.wijgrid("option", "editingMode") === "cell") {
                if (!table.wijgrid("beginEdit")) {
                    var cell = table.wijgrid("currentCell");
                    if (!cell.__isEdit) {
                        var col = cell.cellIndex();
                        var row = cell.rowIndex();
                        if (col >= 0 && col < table.wijgrid("columns").length - 1) {
                            table.wijgrid("currentCell", col + 1, row);
                        }
                        else if (row >= 0 && row < table.wijgrid("option", "data").length - 1) {
                            table.wijgrid("currentCell", 0, row + 1);
                        }
                    }
                }
            }
        }

        function checkResize(tabClick) {
            if (table.data("c1lsNeedResize")) {
                table.data("c1lsNeedResize", false);
                if (tabClick) {
                    table.hide();
                }
                setTimeout(function () {
                    table.show();
                    table.wijgrid("setSize");
                }, 500);
            }
            else if (!tabClick) {
                table.show();
            }
        }

        function redraw() {
            checkResize(true);
        }

        $(".msls-tabs-container li").click(function (e) {
            checkResize(true);
        });

        $(window).resize(function () {
            if (!table.is(":visible")) {
                table.data("c1lsNeedResize", true);
            }
        });

        function findColumn(name) {
            var result = null;
            cols.forEach(function (c) {
                if (c.key === name) {
                    result = c;
                }
            });
            return result;
        }

        $.wijmo.wijcalendar.prototype.options.wijCSS.stateDefault = "ui-btn-up-a";
        $.wijmo.wijcalendar.prototype.options.wijCSS.content = "ui-body ui-body-a";
        $.wijmo.wijgrid.prototype.options.wijCSS.stateHighlight = "ui-state-highlight";

        var me = {
            Columns: cols,
            Rows: rows,
            Sorting: sort,
            Filtering: filter,
            LoadMore: more,
            NextPage: next,
            PreviousPage: previous,
            ShowRowHeader: rowHeader,
            OnCellChanged: cellChange,
            OnCellClicked: cellClick,
            OnCellFormat: cellFormat,
            OnCellUpdate: cellUpdate,
            FindColumn: findColumn,
            EntityChanged: notifyHandler,
            GetRowEntity: rowEntity,
            Redraw: redraw
        };

        return me;
    };

    // wijlist

    c1ls.getListContent = function (contentItem) {

        if (contentItem.children.length > 0) {

            var first = contentItem.children[0];
            var label = first.children[0].valueModel.name;
            var value = label;

            if (first.children.length > 1) {
                value = first.children[1].valueModel.name;
            }

            var items = contentItem.value.data.map(function (r) {
                return { label: r[label], value: r[value] };
            });

            return items;
        }

        return null;
    };

    // HTML <select>

    c1ls.getDropDownContent = function (select, contentItem, options) {

        var items = [];
        var change = null;

        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];
            var label = first.children[0].valueModel.name;
            var model = c1ls.getTypeDesc(first.children[0]);
            var value = label;
            var hasNull = false;

            if (first.children.length > 1) {
                value = first.children[1].valueModel.name;
                model = c1ls.getTypeDesc(first.children[1]);
            }

            var quote = function (v) {
                return v;
            }

            if (model.type === "string") {
                quote = function (v) {
                    return "'" + v + "'";
                }
            }

            if (options !== undefined) {
                if (options.defaultValue !== undefined) {
                    hasNull = true;
                    var text = (options.defaultText !== undefined) ? options.defaultText : "";
                    items.push("<option value=" + quote(options.defaultValue) + ">" + text + "</option>");
                }
            }

            contentItem.value.data.map(function (i) {
                items.push("<option value=" + quote(i[value]) + ">" + i[label] + "</option>");
            });
            
            change = function () {
                var n = select.prop("selectedIndex");
                var s = null;

                if (hasNull && n > 0) {
                    s = contentItem.value.data[n - 1];
                }
                else if (!hasNull && n >= 0) {
                    s = contentItem.value.data[n];
                }

                contentItem.value.selectedItem = s;
            };

            select.bind("change", change);
        }

        return items;
    };

    // wijevcal

    c1ls.getCalendarContent = function (div, contentItem) {

        var items = null;
        var select = null;

        if (contentItem.children.length > 0) {
            var first = contentItem.children[0];

            if (first.children.length > 2) {
                var start = first.children[0].valueModel.name;
                var end = first.children[1].valueModel.name;
                var title = first.children[2].valueModel.name;
                var id = 0;

                items = contentItem.value.data.map(function (r) {
                    return {
                        index: id,
                        id: (++id).toString(),
                        start: r[start],
                        end: r[end],
                        subject: r[title]
                    };
                });
            }

            select = function (e, args) {
                var first = contentItem.children[0];
                var tap = first.properties.tap;

                if (args.data.isNewEvent && tap && tap._boundArguments) {
                    var n = contentItem.value.addNew();

                    if (first.children.length > 2) {
                        var start = first.children[0].valueModel.name;
                        var end = first.children[1].valueModel.name;
                        var title = first.children[2].valueModel.name;
                        n[start] = args.data.start;
                        n[end] = args.data.end;
                        n[title] = args.data.subject;
                    }
                }
                else {
                    contentItem.value.selectedItem = contentItem.value.data[args.data.index];
                }

                if (tap && tap.canExecute) {
                    tap.execute();
                }
                return false;
            };
        }

        function checkResize(tabClick) {
            if (div.data("c1lsNeedResize")) {
                div.data("c1lsNeedResize", false);
                if (tabClick) {
                    div.hide();
                }
                setTimeout(function () {
                    div.show();
                    div.wijevcal("refresh");
                }, 500);
            }
            else if (!tabClick) {
                div.show();
            }
        }

        function redraw() {
            checkResize(true);
        }

        $(".msls-tabs-container li").click(function (e) {
            checkResize(true);
        });

        $(window).resize(function () {
            if (!div.is(":visible")) {
                div.data("c1lsNeedResize", true);
            }
        });

        return {
            Events: items,
            Select: select
        };
    };

    // wijbarchart, wijlinechart, wijscatterchart

    c1ls.getChartContent = function (contentItem) {

        function asNumber(n) {
            return typeof n === "number" ? n : Number(n);
        }

        function getColumns(contentItem) {

            var cols = [];

            if (contentItem.children.length > 0) {
                var first = contentItem.children[0];

                first.children.forEach(function (c) {
                    if (c.isVisible) {
                        cols.push({ label: c.displayName, key: c.valueModel.name, data: [] });
                    }
                });
            }

            return cols;
        }

        var cols = getColumns(contentItem);
        var data = contentItem.value.data;
        var series = [];

        for (var i = 0; i < data.length; i++) {
            cols[0].data.push(data[i][cols[0].key]);

            for (var j = 1; j < cols.length; j++) {
                cols[j].data.push(asNumber(data[i][cols[j].key]));
            }
        }

        for (var n = 1; n < cols.length; n++) {
            series.push({ label: cols[n].label, legendEntry: true, data: { x: cols[0].data, y: cols[n].data } });
        }

        var groupby = function (name) {
            var hash = {};

            data.forEach(function (r) {
                hash[r[name]] = null;
            });

            var unique = Object.keys(hash);
            var groups = [];

            unique.forEach(function (u) {
                var s = { label: u, legendEntry: true, data: { x: [], y: [] } };
                hash[u] = s;
                groups.push(s);
            });

            var x = cols[0].key;
            var y = cols[1].key;

            for (var i = 0; i < data.length; i++) {
                var n = data[i][name];
                hash[n].data.x.push(data[i][x]);
                hash[n].data.y.push(asNumber(data[i][y]));
            }

            return groups;
        };

        var select = function (e, data) {
            if (contentItem.children.length > 0) {
                var tap = contentItem.children[0].properties.tap;
                contentItem.value.selectedItem = contentItem.value.data[data.index];

                if (tap !== null && tap.canExecute) {
                    tap.execute();
                }
            }
        };

        return {
            Series: series,
            GroupBy: groupby,
            OnClick: select,
            Hint: {
                content: function () {
                    return this.label + ": " + this.y;
                },
                contentStyle: {
                    "font-family": c1ls.fontFamily
                }
            }
        };
    };

    // wijpiechart

    c1ls.getPieChartContent = function (contentItem) {

        function asNumber(n) {
            return typeof n === "number" ? n : Number(n);
        }

        var series = [];
        var select = null;

        if (contentItem.children.length > 0) {

            var first = contentItem.children[0];

            if (first.children.length > 1) {
                var label = first.children[0].valueModel.name;
                var value = first.children[1].valueModel.name;

                series = contentItem.value.data.map(function (r) {
                    return { label: r[label], legendEntry: true, data: asNumber(r[value]) };
                });
            }

            var select = function (e, data) {
                var tap = contentItem.children[0].properties.tap;
                contentItem.value.selectedItem = contentItem.value.data[data.index];

                if (tap !== null && tap.canExecute) {
                    tap.execute();
                }
            };
        }

        return {
            Series: series,
            OnClick: select,
            Hint: {
                content: function () {
                    return this.label + ": " + this.value;
                },
                contentStyle: {
                    "font-family": c1ls.fontFamily
                }
            }
        };
    };

    // wijgallery

    c1ls.getGalleryProperties = function (contentItem) {

        var result = {
            caption: null,
            image: null,
            base64: false,

            src: function (v) {
                return this.base64 ? "data:image;base64," + v[this.image] : v[this.image];
            }
        };

        if (contentItem.children.length > 0) {

            var first = contentItem.children[0];

            if (first.children.length >= 2) {
                result.caption = first.children[0].valueModel.name;
                result.image = first.children[1].valueModel.name;
                result.base64 = c1ls.isImageType(first.children[1]);
            }
        }

        return result;
    };

    // JSON

    c1ls.getJsonData = function (data, options) {

        function getJsonColumns(data) {

            var cols = [];

            $.each(data[0], function (key, value) {
                if ($.isNumeric(value)) {
                    cols.push({ label: key, headerText: key, key: key, dataKey: "_C" + cols.length, data: [], dataType: "number", dataFormatString: "n0" });
                }
                else {
                    cols.push({ label: key, headerText: key, key: key, dataKey: "_C" + cols.length, data: [] });
                }
            });

            return cols;
        }

        var rows = $.parseJSON(data);
        var cols = getJsonColumns(rows);
        var series = [];

        for (var i = rows.length - 1; i >= 0; i--) {
            var r = rows[i];
            var v = r[cols[0].key];
            cols[0].data.push(v);
            r["_C0"] = v;

            for (var j = 1; j < cols.length; j++) {
                v = r[cols[j].key];
                cols[j].data.push(v);
                r["_C" + j] = v;
            }
        }

        var totals = "none";
        var length = cols.length;

        if (options !== undefined) {
            if (typeof options.totals === "string") {
                totals = options.totals;
            }
        }

        if (totals === "rows" || totals === "all") {
            var t = rows.length - 1;

            for (var i = 0; i < cols.length; i++) {
                var k = cols[i].dataKey;
                var v = rows[t][k];
                rows[t][k] = [v, { "class": "wijmo-wijgrid-total" }];
                cols[i].data.shift();
            }

            if (length > 0) {
                cols[0].dataType = "string";
                cols[0].dataFormatString = undefined;
            }
        }

        if (totals === "columns" || totals === "all") {
            var k = cols[cols.length - 1].dataKey;
            var n = (totals === "all") ? rows.length - 1 : rows.length;

            for (var i = 0; i < n; i++) {
                var v = rows[i][k];
                rows[i][k] = [v, { "class": "wijmo-wijgrid-total" }];
            }

            if (length > 2) {
                length--;
            }
        }

        for (var n = 1; n < length; n++) {
            series.push({ label: cols[n].label, legendEntry: true, data: { x: cols[0].data, y: cols[n].data } });
        }

        $.wijmo.wijgrid.prototype.options.wijCSS.stateHighlight = "ui-state-highlight";

        return {
            Columns: cols,
            Rows: rows,
            Series: series,
            Hint: {
                content: function () {
                    return this.label + ": " + Globalize.format(this.y, "n0");
                },
                contentStyle: {
                    "font-family": c1ls.fontFamily
                }
            }
        };
    };

    // c1ls

    if (!window.c1ls) {
        window.c1ls = c1ls;
    }

})(window);

