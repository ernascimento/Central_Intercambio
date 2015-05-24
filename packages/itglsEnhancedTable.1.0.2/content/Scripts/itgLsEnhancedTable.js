/// <reference path="msls-2.5.0.js" />
/// <reference path="lodash.js" />


// Check to see if the Itg namespace exists
var itgLs = itgLs || {};

(function ($, _) {

    // What to expose on the namespace
    var enhancedTable = function (options) {

        return enhancedTable.prototype.initialize(options);

    };

    // Our object constructor, hides complexity
    enhancedTable.prototype.initialize = function(options) {
        return new eht(options);
    };


    // Private/Internal constructor
    var eht = function (options) {

        // Instance based properties
        var properties = {

            // Obvious... pointers to our screen/contentItem objects
            screen: options.contentItem.screen,
            contentItem: options.contentItem,

            // Define/default our filter popup items
            filterPopupName: options.filterPopupName || "FilterPopup",
            filterPopupColumnName: options.filterPopupColumnName || "ColumnName",
            filterPopupOperatorName1: options.filterPopupOperatorName1 || "Operator1",
            filterPopupOperatorName2: options.filterPopupOperatorName2 || "Operator2",
            filterPopupConcatName: options.filterPopupConcatName || "Concat",
            filterPopupValueName1: options.filterPopupValueName1 || "Value1",
            filterPopupValueName2: options.fitlerPopupValueName2 || "Value2",

            // Hold our big odata sort string
            sortString: "",
            sortColumns: [],

            // Hold our big odata filter string
            filterString: "",
            filterColumns: [],

            // Pointer to our array of table columns
            tableColumns: options.contentItem.children[0].children,

            // Pointer to the visual collection
            visualCollection: options.contentItem._binding.value,

            // Get the name of this controls data source, ie database name
            dataSourceName: options.contentItem.model.dataSource.member.source.target.source.member.id.split('/')[0],

            // Get the name of the data table associated with this control
            dataTableName: options.contentItem.details._entry.name,

            // Element is the HTML element that contains the table control
            element: $(options.element),

            // Are we going to be in batch mode or not
            batchMode: options.batchMode || false,

            // Are we going to disable filtering
            filterDisabled: options.filterDisabled || false

        };

        function initialize() {

            // Minimal requirements are the controls contentItem and element
            if (properties.contentItem == undefined || properties.element == undefined) return;

            // Update our query method for our dynamic sorting, only need to do this on initialize
            // ==========================================================================================
            options.contentItem.details._entry.simpleDescriptor.createQuery =
                function () {
                    return this.dataWorkspace[properties.dataSourceName][properties.dataTableName].filter(properties.filterString).orderBy(properties.sortString);
                };


            // Find and loop over each TH (header) element
            $("th", properties.element).each(function (i) {

                // Get the column header contentItem based on the index
                var tableColumn = properties.tableColumns[i];

                // Push the pointer onto our filter/sort arrays
                properties.sortColumns.push(tableColumn);
                properties.filterColumns.push(tableColumn);

                // We only skip command (button) types, all others get passed for processing
                if (tableColumn.kind === "Command") {
                    return;
                }

                // Initialize sort/filter property sets for this column
                tableColumn.enhancedTable = {};
                tableColumn.enhancedTable.sort = {};
                tableColumn.enhancedTable.filter = {};

                // Store the html element for ease of accessibility
                tableColumn.enhancedTable.sort.element = $("<div class='itgls-sort-element'><span id='text'></span><span id='icon'></span><span id='iconText' class='itgls-sort-icon-text'></span></div>");
                tableColumn.enhancedTable.filter.element = $("<div class='itgls-filter-element'><span id='text' class='itgls-filter-icon-text'></span><div id='icon' class='ui-btn-no-text ui-btn-inner ui-icon ui-icon-bars itgls-filter-icon-element'></div></div>");

                // Reintroduce the table column name into our header element
                $('#text', tableColumn.enhancedTable.sort.element).text(tableColumn.displayName);

                // This is a hack to stop the propagation of the click on the parent element
                $(this).off('vclick').on('vclick', function (e) { e.stopPropagation(); });

                // Now replace the parent html with our new elements
                $(this).html("");
                $(this).append(tableColumn.enhancedTable.sort.element);
                $(this).append(tableColumn.enhancedTable.filter.element);

                // This property will hold which direction we are sorting, ASC, DESC, NULL
                tableColumn.enhancedTable.sort.direction = null;

                // Initialize the sort/filter position (ordering amongst themselvles)
                tableColumn.enhancedTable.sort.position = null;
                tableColumn.enhancedTable.filter.position = null;
                
                // Initialize our odata compatible field name, accounts for navigational names
                tableColumn.enhancedTable.odataName = (tableColumn.bindingPath.slice(5)).replace('.', '/');

                // Add our own click handlers back in for each header part
                initializeColumnSort(tableColumn);

                // If we are disabling the filtering, don't initialize
                if (!properties.filterDisabled) initializeColumnFilter(tableColumn);

                // If we are to disable filtering, hide the element
                if (properties.filterDisabled) $(tableColumn.enhancedTable.filter.element).hide();

            });
        };


        // ///////////////////////////////////////////////////////////////////////////////////////////
        // ==========================================================================================
        // ==========================================================================================
        // Internal 
        // ==========================================================================================
        // ==========================================================================================
        // ///////////////////////////////////////////////////////////////////////////////////////////


        // Initializes a column for our version of sorting
        // ==========================================================================================
        function initializeColumnSort(tableColumn) {

            var sort = tableColumn.enhancedTable.sort;

            // Add the pointer style to the header element
            $(sort.element).css('cursor', 'pointer');

            $(sort.element).on("click", function (e) {

                e.stopPropagation();

                // Adjust the direction based on the previous direction
                // Ordering flow is Ascending -> Descending -> no sort
                switch (sort.direction) {
                case "asc":
                    // We were ascending... so change to Descending
                    sort.direction = "desc";
                    break;

                case "desc":
                    // We were descending... so change to NULL, no sort
                    sort.direction = null;
                    sort.position = null;

                    // Since we removed a sort item, re-sort the headers based on their sort position
                    properties.sortColumns = _.sortBy(properties.sortColumns, function(item) {
                        return item.enhancedTable.sort.position == null ? 10000 : item.enhancedTable.sort.position;
                    });
                    break;

                default:
                    // We were null or undefined, so we go to ascending now
                    sort.direction = "asc";
                    sort.position = 1000;

                    // Since we added a sort item, re-sort the fields based on their sort position
                    properties.sortColumns = _.sortBy(properties.sortColumns, function(item) {
                        return item.enhancedTable.sort.position == null ? 10000 : item.enhancedTable.sort.position;
                    });
                    break;
                }

                // Recalculate the sortPosition property, for use in the header display
                _.each(properties.sortColumns, function(item, index) {
                    if (item.enhancedTable.sort.position != null) {
                        item.enhancedTable.sort.position = index;
                    }
                });

            	// If batchMode was sent as true, then don't set the sort, user will do this
				if (!properties.batchMode) reQuery();

                // Update the headers with the sort information (graphic, position)
                updateTableHeaders();

            });
        };

        // Initializes a column for individual filter capability
        // ==========================================================================================
        function initializeColumnFilter(tableColumn) {

            var filter = tableColumn.enhancedTable.filter;

            // A filter is: Operator: xxxx, Value: xxxx
            filter.set = [];
            filter.concatType = null;

            var propertyType = tableColumn.valueModel.propertyType;

            filter.dataType = propertyType.__isPrimitiveType
                ? propertyType.id
                : propertyType.underlyingType.id;

            // Add the pointer style to the header element
            $(filter.element).css('cursor', 'pointer');

            // Look for the filter popup
            var filterPopup = properties.screen.findContentItem(properties.filterPopupName);

            // If found, initialize the on click
            if (filterPopup != undefined) {
                $(filter.element).on("click", function(e) {

                    e.stopPropagation();

                    // Quick/Easy hack to make sure your dropdowns can be dynamic
                    // Remove our stale popup so we can populate with new dropdown values
                    $("div[data-msls-name*='" + properties.filterPopupName + "']").remove();

                    // Pointer to our active column
                    properties.activeColumn = tableColumn;

                    // Initialize our screen inputs
                    initializeFilterOperators();
                    initializeFilterConcats();
                    initializeFilterValues();

                    // Update our field/column name
                    properties.screen[properties.filterPopupColumnName] = tableColumn.displayName;

                    // Finally show the popup, DOM for the popup gets recreated dynamically
                    properties.screen.showPopup(properties.filterPopupName);

                });
            }

        };

        // Stuff the filter operator dropdowns with appropriate values
        // ==========================================================================================
        function initializeFilterOperators() {

            // Get our current column filter property
            var filter = properties.activeColumn.enhancedTable.filter;

            // Get our operator contentItems
            var operatorContentItems = [];
            operatorContentItems.push(properties.screen.findContentItem(properties.filterPopupOperatorName1));
            operatorContentItems.push(properties.screen.findContentItem(properties.filterPopupOperatorName2));

            var operators;
            var defaultValueIndex = 0;

			if (filter.dataType.indexOf(":String") != -1) {

				defaultValueIndex = 2;
				operators = [
					{ stringValue: "Is equal to", value: "eq" },
					{ stringValue: "Is not equal to", value: "ne" },
					{ stringValue: "Starts with", value: "startswith" },
					{ stringValue: "Contains", value: "substringof" },
					{ stringValue: "Does not contain", value: "not substringof" },
					{ stringValue: "Ends with", value: "endswith" }
				];

			} else if (filter.dataType.indexOf(":Date") != -1) {
				operators = [
					{ stringValue: "Is equal to", value: "eq" },
					{ stringValue: "Is not equal to", value: "ne" },
					{ stringValue: "Is after or equal to", value: "ge" },
					{ stringValue: "Is after", value: "gt" },
					{ stringValue: "Is before or equal to", value: "le" },
					{ stringValue: "Is before", value: "lt" }
				];

			} else {
				operators = [
					{ stringValue: "Is equal to", value: "eq" },
					{ stringValue: "Is not equal to", value: "ne" },
					{ stringValue: "Is greater than or equal to", value: "ge" },
					{ stringValue: "Is greater than", value: "gt" },
					{ stringValue: "Is less than or equal to", value: "le" },
					{ stringValue: "Is less than", value: "lt" }
				];

			}

            for (var i = 0; i < operatorContentItems.length; i++) {
            	var defaultValue = operators[defaultValueIndex].value;
            	var defaultStringValue = operators[defaultValueIndex].stringValue;

            	// If there was a saved filter, get it
            	if (filter.set[i] != undefined && filter.set[i].operator != undefined) {
            		var savedFilter = _.find(operators, function (op) {
            			return op.value == filter.set[i].operator;
            		});

            		if (savedFilter) {
            			// Save our value into the screen property
            			//properties.screen[operatorContentItems[i].value] = defaultValue;
            			defaultValue = savedFilter.value;
            			defaultStringValue = savedFilter.stringValue;
            		}

            	}

            	// Set our values
            	operatorContentItems[i].choiceList = operators;
            	operatorContentItems[i].value = defaultValue;
            	operatorContentItems[i].stringValue = defaultStringValue;
            	properties.screen[operatorContentItems[i].name] = defaultValue;
            }

        };

        // Stuff the filter Concat dropdown with appropriate values
        // ==========================================================================================
        function initializeFilterConcats() {

            // Get our current column filter property
            var filter = properties.activeColumn.enhancedTable.filter;

            var concat = properties.screen.findContentItem(properties.filterPopupConcatName);

            concat.choiceList = [
                { stringValue: "And", value: "and" },
                { stringValue: "Or", value: "or" }
            ];

            properties.screen[concat.name] = filter.concatType || "or";

        };

        // Initialize popup filter value fields
        // ==========================================================================================
        function initializeFilterValues() {

            // Get our current column filter property
            var filter = properties.activeColumn.enhancedTable.filter;

            // Get our value contentItems
            var valueContentItems = [];
            valueContentItems.push(properties.screen.findContentItem(properties.filterPopupValueName1));
            valueContentItems.push(properties.screen.findContentItem(properties.filterPopupValueName2));

            for (var i = 0; i < valueContentItems.length; i++) {

                var defaultValue = null;

                if (filter.set[i] != undefined && filter.set[i].value != undefined) {
                    defaultValue = filter.set[i].value;
                }

                properties.screen[valueContentItems[i].name] = defaultValue;


            }

        };

        // Aggregate the column filter settings into a big string
        // ==========================================================================================
        function updateFilterString() {

            // Create our a string that will be used for our sort
            properties.filterString = "";

            // If filters are enabled, go update, else string remains as empty
            if (!properties.filterDisabled) {

                // Loop over each of the filterable columns
                _.each(properties.filterColumns, function (item) {

                    // If the column has a filter position, lets work it
                    if (item.enhancedTable.filter.position != undefined && item.enhancedTable.filter.position != null) {

                        // Go get the filter string for this column
                        var temp = getColumnFilterString(item.enhancedTable.filter, item.enhancedTable.odataName);

                        // If we have existing data in the string and we got a filter back for this column, add our and
                        if (properties.filterString.length > 0 && temp.length > 0) properties.filterString += " and ";

                        // Simple concat
                        properties.filterString += temp;

                    }
                });
            }
        };

        // Aggregate the column sort settings into a big string
        // ==========================================================================================
        function updateSortString() {

            // Empty any existing sort definition
            properties.sortString = "";

            // Create an OData string that will be used for our sort
            _.each(properties.sortColumns, function (item) {
                if (item.enhancedTable.sort.position != undefined && item.enhancedTable.sort.position != null) {
                    properties.sortString += item.enhancedTable.odataName + " " + item.enhancedTable.sort.direction + ", ";
                }
            });

            // Remove the last character, which is the last comma
            properties.sortString = properties.sortString.slice(0, -2);

        };

        // Get a formatted filter string for an individual column
        // ==========================================================================================
        function getColumnFilterString(filter, dataField) {

            var filterString = "";
            var formatString;

            // Only if we have at least one filter defined
            if (filter.set[0] != undefined) {

                // Lets go process the set
                _.each(filter.set, function(item) {

                    var tempValue = item.value;

                	// Go get our format string for this item
                    formatString = getFilterFormatString(item.operator, filter.dataType);

                	// If this is a date data type, we need to preprocess the value for transport
                    if (filter.dataType.indexOf(":Date") != -1) {

                        tempValue = new Date(tempValue);

                    };

                    // If there is data in our filter string, add our concat before the next
                    if (filterString.length > 0) filterString += filter.concatType + " ";

                    // Add format to the filter and add to our bigger item
                    filterString += String.format(formatString, dataField, item.operator, msls._toODataString(tempValue, filter.dataType));

                });

            }

            // Enclose this 'set' in parens
            return filterString != "" ? "(" + filterString + ")" : filterString;
        };

        // Get the format template for a filter
        // ==========================================================================================
        function getFilterFormatString(operator, dataType) {

        	var result;

			if (dataType.indexOf(":String") != -1) {
				switch (operator) {
					case "substringof":
						result = "{1}({2}, {0}) ";
						break;

					case "not substringof":
						result = "{1}({2}, {0}) ";
						break;

					case "startswith":
						result = "{1}({0}, {2}) ";
						break;

					case "endswith":
						result = "{1}({0}, {2}) ";
						break;

					default:
						result = "{0} {1} {2} ";
						break;
				}

			} else {
				result = "{0} {1} {2} ";
			}

            return result;

        };



        // ///////////////////////////////////////////////////////////////////////////////////////////
        // ==========================================================================================
        // ==========================================================================================
        // External 
        // ==========================================================================================
        // ==========================================================================================
        // ///////////////////////////////////////////////////////////////////////////////////////////


        // Re Query to refresh the table
        // ==========================================================================================
        function reQuery() {

            // Update our different OData strings
            updateFilterString();
            updateSortString();

            // Refresh the visual collection, resulting in the table refreshing
            properties.visualCollection.refresh();

        };

    	// Re Query to refresh the table
    	// ==========================================================================================
        function clearAll() {

			// Clear the sorts and filters, defer the query
        	clearAllSorts();
        	clearAllFilters();

        };

        // Clear the sort fields, if in batchMode also execute the sort
        // ==========================================================================================
        function clearAllSorts() {

            // Loop over all the columns, set sort properties to null
            _.each(properties.sortColumns, function (item) {
                item.enhancedTable.sort.position = null;
                item.enhancedTable.sort.direction = null;
            });

            // Update the headers with the sort information (graphic, position)
            updateTableHeaders();

        };

        // Do you want to disable the filter capability?  Can be called externally also
        // ==========================================================================================
        function disableFilters(yes) {

            // Make sure we have a value
            if (yes == undefined) yes = true;

            // If yes, go ahead and clear all the filters first
            if (yes) {
                clearAllFilters();
            }

            // Loop over the columns, and show/hide the filter icon, in essence removing filtering
            _.each(properties.filterColumns, function (item) {
                if (yes) {
                    $(item.enhancedTable.filter.element).hide();
                } else {

                    // Look for the filter popup
                    var filterPopup = properties.screen.findContentItem(properties.filterPopupName);

                    // If found, go ahead and show the filter icon
                    if (filterPopup != undefined) $(item.enhancedTable.filter.element).show();
                }
            });

        };

        // Set the filter for the individual column, called from the filter popup
        // ==========================================================================================
        function setColumnFilter() {

            // Get the column filter object for this popup instance
            var filter = properties.activeColumn.enhancedTable.filter;

            // Make sure we start fresh
            filter.set = [];

            // Only proceed if there is a value in the first value input element
            if (properties.screen[properties.filterPopupValueName1] != undefined && properties.screen[properties.filterPopupValueName1] != null) {

                // Add this first key/value set into our filter set
                filter.set.push({
                    operator: properties.screen[properties.filterPopupOperatorName1],
                    value: properties.screen[properties.filterPopupValueName1]
                });

                // If there is also data in the second value input element
                if (properties.screen[properties.filterPopupValueName2] != undefined && properties.screen[properties.filterPopupValueName2] != null) {

                    // Add this second key/value into the set
                    filter.set.push({
                        operator: properties.screen[properties.filterPopupOperatorName2],
                        value: properties.screen[properties.filterPopupValueName2]
                    });

                }

            }


        	// Initialize the filter position for this column
            if (filter.position == null)
            	filter.position = filter.set.length > 0 ? 1000 : null;

            // Setup the concat field, regardless of values or not
            filter.concatType = properties.screen[properties.filterPopupConcatName];

            // Since we added/removed a filter item, re-sort the fields based on their filter position
            properties.filterColumns = _.sortBy(properties.filterColumns, function (item) {
                return item.enhancedTable.filter.position == null ? 10000 : item.enhancedTable.filter.position;
            });

            // Recalculate the filter position property, for use in the header display
            _.each(properties.filterColumns, function (item, index) {
                if (item.enhancedTable.filter.position != null) {
                    item.enhancedTable.filter.position = index;
                }
            });

			// Get the data if we are not in batch mode
	        if (!properties.batchMode) reQuery();

        	// So now lets go update the column headers
            updateTableHeaders();

        };

        // Clear the filter fields, if in batchMode also execute the sort
        // ==========================================================================================
        function clearAllFilters() {

            // Loop over the filter columns
            _.each(properties.filterColumns, function (item) {
                var filter = item.enhancedTable.filter;

                // Set their individual data to null
                filter.position = null;
                filter.set = [];
                filter.concatType = null;
            });


            // Update the headers with the filter information (graphic, position)
            updateTableHeaders();

        };

        // Clear the filter fields, if in batchMode also executes the sort
        // ==========================================================================================
        function clearColumnFilter() {

            // Get the column filter object for this popup instance
            var filter = properties.activeColumn.enhancedTable.filter;

            // Nullify this individual columns filter data
            filter.position = null;
            filter.set = [];
            filter.concatType = null;

            // Re sort the filter columns, setting up for updating the header display
            properties.filterColumns = _.sortBy(properties.filterColumns, function (item) {
                return item.enhancedTable.filter.position == null ? 10000 : item.enhancedTable.filter.position;
            });

            // Recalculate the sortPosition property, for use in the header display
            _.each(properties.filterColumns, function (item, index) {
                if (item.enhancedTable.filter.position != null) {
                    item.enhancedTable.filter.position = index;
                }
            });

        	// Get the data if we are not in batch mode
            if (!properties.batchMode) reQuery();

            // Update the headers with the sort information (graphic, position)
            updateTableHeaders();

        };

        // Update table column headers based on sort/filter properties
        // ==========================================================================================
        function updateTableHeaders() {

            // loop over our headers
            _.each(properties.tableColumns, function (item) {

                var showActive = true;
                var parentElement = item.enhancedTable.sort.element.parent();
                var sortElement = item.enhancedTable.sort.element;
                var filterElement = item.enhancedTable.filter.element;

                // If sort position is set, update the header
                if (item.enhancedTable.sort.position != null) {
                    var graphic = item.enhancedTable.sort.direction == "asc" ? " - &#9650" : " - &#9660";
                    $('#iconText', sortElement).html(item.enhancedTable.sort.position + 1);
                    $('#icon', sortElement).html(graphic);
                } else {

                    // No sort position, so showActive is a no, so far
                    showActive = false;

                    // No sort position, so just show the default text
                    $('#iconText', sortElement).html("");
                    $('#icon', sortElement).html("");
                }


                // Only update the filter items if filters are enabled
                if (!properties.filterDisabled) {

                    // Now lets do the same for the filters, is there a sort position?
                    if (item.enhancedTable.filter.position != null) {

                        // If so, make sure our showActive is now also true
                        showActive = true;

                        // Update the screen with its position number
                        $('#text', filterElement).text(item.enhancedTable.filter.position + 1);
                    } else {

                        $('#text', filterElement).text("");
                    }
                }

                // Finally, if showActive, add a class to make pretty the parent element
                if (showActive) {
                    $(parentElement).addClass('ui-btn-active');
                } else {
                    $(parentElement).removeClass('ui-btn-active');
                }


            });
        };

        // Allow dynamically toggling batch mode
        // ==========================================================================================
        function setBatchMode(onOff) {
            properties.batchMode = onOff || false;
        };

		function getBatchMode() {
			return properties.batchMode;
		};

	    // Helper to make it easy to close the filter popup
        // ==========================================================================================
        function closeFilterPopup() {
            properties.screen.closePopup(properties.filterPopupName);
        };

        // Finally... our constructor
        // ==========================================================================================
        (function () {
            initialize();
        })();

        // What do we want to expose to the outside
        // ==========================================================================================
	    return {
		    reQuery: reQuery,
		    clearAll: clearAll,
		    clearAllSorts: clearAllSorts,
		    clearAllFilters: clearAllFilters,
		    clearColumnFilter: clearColumnFilter,
		    disableFilters: disableFilters,
		    setColumnFilter: setColumnFilter,
		    closeFilterPopup: closeFilterPopup,
		    setBatchMode: setBatchMode,
		    getBatchMode: getBatchMode
		};
    };


    // Put onto our namespace
    // ==========================================================================================
    itgLs.EnhancedTable = itgLs.EnhancedTable || enhancedTable;

// Pass in our jquery and lo-dash objects
})(window.jQuery, window._);


(function($) {

	// Make sure our ui space is there
	// ==========================================================================================
	itgLs = itgLs || {};
	itgLs.ui = itgLs.ui || {};

	// ==========================================================================================
	// Quick little function to convert a standard button to Iconic button
	// Added here for this targeted example, is typically part of the itgLs library
	// ==========================================================================================
	itgLs.ui.convertToIconicButton = function (element, contentItem, icon, noText) {

		// The following icon names are standard with LightSwitch:
		// ok, cancel, discard, decline, save, logout, back, search, camera, trash, add, remove,
		// video, tag, gear, contacts, edit, question, refreesh, list, folder, move, text, attachment,
		// warning, star, addfavorite, filter, sort, addpicture, document, download, calendar, dropdown

		// Create our html items for our button
		var $div = $('<div class="id-element msls-large-icon ui-btn ui-shadow ui-mini ui-btn-icon-top ui-btn-up-a" data-theme="a" style="box-shadow: none;"></div>');
		var $innerButton = $('<span class="ui-btn-inner"></span>');
		var $textSpan = $('<span class="ui-btn-text">' + contentItem.displayName + '</span>');
		var $iconSpan = $('<span class="ui-icon ui-icon-msls-' + icon + ' ui-icon-shadow">&nbsp;</span>');


		if (noText == true) {

			// Add all of our items under the big div
			$div.append($innerButton.append($iconSpan));

		} else {

			// Add all of our items under the big div
			$div.append($innerButton.append($textSpan).append($iconSpan));

			// Bind to the displayName so the text can be dynamically changed
			contentItem.dataBind('displayName', function (newValue) {
				$textSpan.text(newValue);
			});

		}

		// Add our new button to the element
		$(element).html($div);

		// Removing the msls-leaf will drop the big padding typically used
		$(element).closest('.msls-leaf').removeClass('msls-leaf');

	};

// Pass in our jquery and lo-dash objects
})(window.jQuery);
