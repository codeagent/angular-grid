angular.module('angular-grid-view', [
		'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui.select', 'grid-view-templates'
	])
	.provider('gridView', function()
	{
		var provider = this;

		this.dataColumnConfig = {
			label: '',
			attribute: '',
			sortable: true,
			template: '',
			templateUrl: 'templates/grid-view/cell/data.tpl.html',
			type: 'data',
			filter: 'text'
		};

		this.checkboxColumnConfig = {
			attribute: '',
			template: '',
			templateUrl: 'templates/grid-view/cell/checkbox.tpl.html',
			type: 'checkbox'
		};

		this.operationsColumnConfig = {
			label: 'Actions',
			template: '',
			templateUrl: 'templates/grid-view/cell/operations.tpl.html',
			sortable: false,
			filter: false
		};

		this.defaultSort = {};

		this.paginationConfig = {
			page: 1,
			pageSizeVariants: [
			{
				name: "10",
				value: 10
			},
			{
				name: "25",
				value: 25
			},
			{
				name: "50",
				value: 50
			},
			{
				name: "100",
				value: 100
			}],
			pageSize: 10
		};

		this.defaultFilter = {};

		this.operationConfig = {
			id: 'operation',
			label: 'Operation',
			icon: 'fa fa-pencil',
			make: function(target)
			{
				return target;
			},
			condition: function(target)
			{
				return true;
			},
			multiple: true,
			single: true,
			reloadOnDone: true
		};

		this.promptConfig = {
			icon: 'fa fa-pencil',
			label: 'Prompt',
			condition: function(target)
			{
				return true;
			},
			make: function(target)
			{
				return target;
			},
			prompt:
			{
				enabled: true,
				title: "Action",
				message: "Do you really want  perform this action?"
			},
			multiple: false,
			single: false,
			reloadOnDone: true
		};

		this.defaultTemplates = {
			grid: 'templates/grid-view/grid-view.tpl.html',
			modal: 'templates/grid-view/modal.tpl.html',
			operationsDropdown: 'templates/grid-view/_operations.tpl.html',
			pageSizeDropdown: 'templates/grid-view/_page-size.tpl.html',
			pagination: 'templates/grid-view/_pagination.tpl.html',
			summary: 'templates/grid-view/_summary.tpl.html',
			table: 'templates/grid-view/_table.tpl.html',
		};

		this.$get = ["$q", "$http", "$templateCache", "$injector", "gridViewService", "$uibModal", "$rootScope", "$compile", function($q, $http, $templateCache, $injector, gridViewService, $uibModal, $rootScope, $compile)
		{

			function resolveTemplateUrl(url)
			{
				var template;

				if (!url.match(/\.html$/))
					throw new Error('Wrong template url: "' + url + '"');

				if (!(template = $templateCache.get(url)))
					return $http
						.get(url,
						{
							cache: true
						})
						.then(function(response)
						{
							$templateCache.put(url, response.data)
							return response.data;
						})
						.catch(function()
						{
							throw new Error("Template located at " + url + " cannot be resolved.")
						});

				return $q.when(template);
			}

			function injectable(obj, locals)
			{
				locals = locals ||
				{};
				if (angular.isFunction(obj) || angular.isArray(obj))
					return $injector.invoke(obj, locals);
				return obj;
			}

			function humanize(text)
			{
				return text[0].toUpperCase() + text.substr(1);
			}

			var serviceRegistry = {},
				filterRegistry = {},
				promptRegistry = {},
				gridRegistry = {};

			function registerService(name, serviceConfig)
			{
				serviceConfig = serviceConfig ||
				{};
				serviceRegistry[name] = gridViewService(serviceConfig);
			}

			function registerGrid(name, gridConfig)
			{
				if (!gridConfig.service)
					throw new Error("'service' property required.");

				if (angular.isObject(gridConfig.service))
					gridConfig.service = gridViewService(gridConfig.service);
				else
					gridConfig.service = serviceRegistry[gridConfig.service];

				if (!gridConfig.columns)
					throw new Error("'columns' property must be specified.");

				gridConfig = angular.merge(
				{},
				{
					service: serviceRegistry[gridConfig.service],
					columns: [],
					operations: [],
					sort: provider.defaultSort,
					pagination: provider.paginationConfig,
					filter: provider.defaultFilter,
					templates: provider.defaultTemplates
				}, gridConfig);

				// resolve paginaton
				for (var i = gridConfig.pagination.pageSizeVariants.length - 1; i >= 0; i--)
				{
					var v = gridConfig.pagination.pageSizeVariants[i];
					v.name = injectable(v.name);
					if (v.value == gridConfig.pagination.pageSize)
						break;
				}

				if (i < 0)
					gridConfig.pagination.pageSize = gridConfig.pagination.pageSizeVariants[0].value;

				// resolve columns
				var columns = [],
					filters = [];
				var columnConfig = {
					'data': provider.dataColumnConfig,
					'checkbox': provider.checkboxColumnConfig,
					'operations': provider.operationsColumnConfig
				};
				angular.forEach(gridConfig.columns, function(column, i)
				{

					if (!column.type)
						column.type = 'data';

					gridConfig.columns[i] = column = angular.merge(
					{}, columnConfig[column.type], column);

					if (column.type != 'operations' && !column.attribute)
						throw new Error("'attribute' column option is required.");

					if (column.type == 'data' && !column.label)
					{
						column.label = humanize(column.attribute);
					}

					if (column.label)
						column.label = injectable(column.label);

					// Attach resolved filters into column
					if (column.filter && filterRegistry[column.filter])
					{
						filters.push(filterRegistry[column.filter]);
						filterRegistry[column.filter].then(function(filter)
						{
							column.filter = filter;
						})
					}

					if (column.template)
					{
						column.template = injectable(column.template);
						columns.push($q.when(column));
					}
					else if (column.templateUrl)
					{
						columns.push(
							resolveTemplateUrl(injectable(column.templateUrl))
							.then(function(template)
							{
								column.template = template;
								return column;
							}));
					}
					else
						throw new Error("Template for column '" + column.label + "' not specified.")
				});

				// resolve templates
				var templates = {};
				angular.forEach(gridConfig.templates, function(template, id)
				{
					templates[id] = resolveTemplateUrl(injectable(template))
				});

				// resolve operations
				angular.forEach(gridConfig.operations, function(op, index)
				{

					if (angular.isString(op))
					{
						op = promptRegistry[op];
					}
					else
					{
						op = angular.merge(
						{}, provider.operationConfig, op);
						op.label = injectable(op.label);
					}
					gridConfig.operations[index] = op;
				});

				gridRegistry[name] = $q.all(
				{
					columns: $q.all(columns),
					templates: $q.all(templates),
					filters: $q.all(filters),
					config: gridConfig
				});
			}

			function registerPrompt(name, promptConfig)
			{
				promptConfig = angular.merge(
				{}, provider.promptConfig, promptConfig);
				promptConfig.label = injectable(promptConfig.label);
				promptConfig.prompt.title = injectable(promptConfig.prompt.title);
				promptConfig.prompt.message = injectable(promptConfig.prompt.message);

				var make = promptConfig.make;
				promptConfig.make = function(target)
				{

					if (promptConfig.prompt.enabled)
					{
						var scope = $rootScope.$new();
						scope.icon = promptConfig.icon;
						scope.title = promptConfig.prompt.title;
						scope.message = promptConfig.prompt.message;

						return $uibModal.open(
							{
								scope: scope,
								templateUrl: provider.defaultTemplates.modal
							})
							.result
							.then(function()
							{
								return make(target);
							})
					}
					return make(target);
				}

				promptRegistry[name] = promptConfig;
			}

			function registerFilter(name, filterConfig)
			{
				filterConfig = angular.merge(
				{},
				{
					controller: function() {},
					template: '',
					templateUrl: 'templates/grid-view/text.tpl.html'
				}, filterConfig);

				var promise;
				if (filterConfig.template)
				{
					filterConfig.template = injectable(filterConfig.template);
					promise = $q.when(filterConfig);
				}
				else if (filterConfig.templateUrl)
				{
					promise = resolveTemplateUrl(injectable(filterConfig.templateUrl))
						.then(function(template)
						{
							filterConfig.template = template;
							return filterConfig;
						});
				}

				filterRegistry[name] = promise;
			}

			var factory = function(name)
			{
				if (!gridRegistry[name])
					throw new Error('Undefined grid widget: "' + name + '"');
				return gridRegistry[name];
			};

			return angular.extend(factory,
			{
				filter: function(name, config)
				{
					registerFilter(name, config);
					return this;
				},
				service: function(name, config)
				{
					registerService(name, config);
					return this;
				},
				prompt: function(name, config)
				{
					registerPrompt(name, config);
					return this;
				},
				grid: function(name, config)
				{
					registerGrid(name, config);
					return this;
				}
			});
		}];
	});

angular.module('angular-grid-view')
	.run(["gridView", function(gridView)
	{
		gridView
			.filter('text',
			{
				templateUrl: 'templates/grid-view/filter/text.tpl.html'
			})
			.filter('boolean',
			{
				templateUrl: 'templates/grid-view/filter/select.tpl.html',
				controller: ['$scope', function($scope)
					{
						$scope.options = [
							{
								'value': undefined,
								'label': 'All'
   						},
							{
								'value': 1,
								'label': 'Yes'
                     },
							{
								'value': 0,
								'label': 'No'
                     }
                  ];
            }]
			})
			.filter('daterange',
			{
				templateUrl: 'templates/grid-view/filter/date-range.tpl.html',
				controller: ['$scope', function($scope){

               $scope.range = {};

               $scope.$watchGroup(['range.startDate', 'range.endDate'], function(n, o) {
                  if(!o[0] || !o[1])
                     return;

                  $scope.filter[$scope.column.attribute] = {
                     from: parseInt(n[0].format('x') / 1000),
                     to: parseInt(n[1].format('x') / 1000),
                  };
               }, true);
            }]
			});
	}])

angular.module('angular-grid-view')
	.provider("gridViewService", function() {
		this.defaults = {
			url: '',
			filterParam: 'filter',
			pageParam: 'page',
			pageSizeParam: 'page-size',
			sortParam: 'sort',
			format: function(response) {
				return {
					items: response.data,
					total: response.headers('X-Pagination-Total-Count')
				}
			}
		};

		var provider = this;

		this.$get = ["$http", "$injector", function($http, $injector) {

			function createService(options) {
				options = angular.merge({}, provider.defaults, options);

				return (function() {
					var filter = null,
						sort = null,
						page,
						pageSize;

					return {
						url: (angular.isFunction(options.url) || angular.isArray(options.url)) ? $injector.invoke(options.url) : options.url,

						filter: function(f) {
							filter = f;
							return this;
						},

						sort: function(s) {
							sort = s;
							return this;
						},

						page: function(p) {
							page = p;
							return this;
						},

						pageSize: function(sz) {
							pageSize = sz;
							return this;
						},

						fetch: function() {
							var url = {};
							url[options.filterParam] = filter;
							url[options.pageParam] = page;
							url[options.pageSizeParam] = pageSize;
							url[options.sortParam] = sort;

							for (var i in url)
								if (!url[i] || angular.equals(url[i], {}))
									delete url[i];

							if (this.url.indexOf("?") >= 0)
								url = this.url + "&" + jQuery.param(url);
							else
								url = this.url + "?" + jQuery.param(url);

							return $http
								.get(url)
								.then(function(response) {
									return options.format(response);
								})
								.catch(function(response) {
									throw new Error(response.statusText);
								});
						}
					};
				})();
			}

			return function(config) {
				return createService(config);
			};
		}];
	});

/*
The MIT License (MIT)

Copyright (c) 2014 Incuna Ltd

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


angular.module('angular-grid-view')
.directive('bindHtmlCompile', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch(function () {
                return scope.$eval(attrs.bindHtmlCompile);
            }, function (value) {
                // Incase value is a TrustedValueHolderType, sometimes it
                // needs to be explicitly called into a string in order to
                // get the HTML string.
                element.html(value && value.toString());
                // If scope is provided use it, otherwise use parent scope
                var compileScope = scope;
                if (attrs.bindHtmlScope) {
                    compileScope = scope.$eval(attrs.bindHtmlScope);
                }
                $compile(element.contents())(compileScope);
            });
        }
    };
}]);

angular.module('angular-grid-view')
	.directive('gridView', ["gridView", "$compile", "$injector", "$q", "$timeout", function(gridView, $compile, $injector, $q, $timeout) {

		return {
			scope: {
				name: '@'
			},
			link: function($scope, $element, $attrs) {
				var grid = gridView($scope.name);

				grid.then(function(r) {
					var config = r.config,
						templates = r.templates,
						filters = r.filters;

					angular.extend($scope, {
						min: Math.min,
						max: Math.max
					}, config);

					for (var i = $scope.pagination.pageSizeVariants.length - 1; i >= 0; i--) {
						var v = $scope.pagination.pageSizeVariants[i];
						if (v.value == $scope.pagination.pageSize) {
							$scope.pagination.pageSize = v;
							break;
						}
					}

					if (i < 0)
						$scope.pagination.pageSize = $scope.pagination.pageSizeVariants[0];

					$scope.keyAttribute = null;
					for (var i = $scope.columns.length - 1; i >= 0; i--)
						if ($scope.columns[i].type == 'checkbox') {
							$scope.keyAttribute = $scope.columns[i].attribute;
							break;
						}

						// request data
					reload();

					// compile, link and put to document
					$element.append($compile(templates.grid)($scope));

					// colum filters
					$timeout(function() {
						var filterStrip = angular.element('<tr></tr>')
						$element
							.find('table thead')
							.append(filterStrip);

						angular.forEach(r.columns, function(column) {
							var filter = column.filter,
								cell = angular.element("<td></td>");

							if (filter) {
								var scope = $scope.$new();
								scope.column = column;
								$injector.invoke(filter.controller, filter, {
									'$scope': scope
								});
								cell.append($compile(filter.template)(scope));
							}

							filterStrip.append(cell);
						});
					});
				});

				$scope.rows = [];
				$scope.pending = true;
				$scope.total = 0;

				function reload() {
					$scope.pending = true;
					$scope.selected.items = {};
					$scope.operation = null;
					return $scope
						.service
						.filter($scope.filter)
						.sort($scope.sort)
						.page($scope.pagination.page)
						.pageSize($scope.pagination.pageSize.value)
						.fetch()
						.then(function(result) {
							$scope.rows = result.items;
							$scope.total = result.total;
							return result;
						})
						.finally(function() {
							$scope.pending = false;
						});
				}

				// Toggle `all` checkbox
				$scope.selected = {
					all: false,
					items: {}
				};

				$scope.$watchCollection('selected.items', function() {
					var count = 0;
					for (var i in $scope.selected.items)
						if ($scope.selected.items[i])
							count++;

					$scope.selected.all = !!(count && count == $scope.rows.length);
				});

				$scope.toggleAll = function(column) {
					var count = 0;
					for (var i in $scope.selected.items)
						if ($scope.selected.items[i])
							count++;

					for (var i in $scope.rows) {
						var row = $scope.rows[i],
							id = row[column.attribute];
						$scope.selected.items[id] = (count < $scope.rows.length);
					}
				};

				// Sort column
				$scope.sortColumn = function(column) {
					if ($scope.pending)
						return;

					var order = 'asc';
					if ($scope.sort[column.attribute])
						order = $scope.sort[column.attribute].match(/asc/i) ? 'desc' : 'asc';
					$scope.sort = {};
					$scope.sort[column.attribute] = order;
				};

				$scope.$watchGroup(['sort', 'pagination.page', 'pagination.pageSize'], function(n, o) {
					if (n === o)
						return;
					reload();
				});

				$scope.$watchCollection('filter', function(o, n) {
					if (n === o)
						return;
					reload();
				})

				// Operations
				$scope.makeMultipleOperation = function(operation) {

					if (!$scope.keyAttribute)
						return;

					var target = $scope.rows.filter(function(row) {
						return row[$scope.keyAttribute] in $scope.selected.items;
					});

					if (!target.length)
						return;

					$scope.pending = true;
					$q
						.when(operation.make(target))
						.then(function(r) {
							if (operation.reloadOnDone)
								return reload();
							return r;
						})
						.finally(function() {
							$scope.pending = false;
							$scope.selected.items = {};
						});
				};

				$scope.makeSingleOperation = function(operation, row) {
					$scope.pending = true;
					$q
						.when(operation.make(row))
						.then(function(r) {
							if (operation.reloadOnDone)
								return reload();
							return r;
						})
						.finally(function() {
							$scope.pending = false;
						});
				};
			}
		};
	}]);

angular.module('angular-grid-view')
	.directive('gridViewDateRange', function () {
		return {
			restrict: 'A',
			scope   : {
				gridViewDateRange: '=?'
			},

			link: function ($scope, $element, $attrs) {
				$scope.gridViewDateRange = angular.extend(
					{
						locale         : {
							format: 'DD.MM.YYYY'
						},
						linkedCalendars: false,
						startDate      : moment('2000-01-01'),
						endDate        : moment(),
						showDropdowns  : true,
						autoUpdateInput: true,
						opens          : 'center',
						ranges         : {
							'Today'        : [moment(), moment()],
							'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
							'Last 7 Days': [moment().subtract(6, 'days'), moment()],
							'Last 30 Days': [moment().subtract(29, 'days'), moment()],
							'Last 6 Months': [moment().subtract(6, 'months'), moment()],
							'All'          : [moment('2000-01-01'), moment()]
						}
					}, $scope.gridViewDateRange);

				$scope.$watchGroup(['gridViewDateRange.startDate', 'gridViewDateRange.endDate'], function (value) {
					update(moment(value[0]), moment(value[1]));
				});

				function update(start, end) {
					$element.html('\
               <span class="gv-nowrap">\
                  <i class="fa fa-calendar glyphicon glyphicon-calendar"></i>\
                  ' + start.format($scope.gridViewDateRange.locale.format) + ' &mdash; ' + end.format($scope.gridViewDateRange.locale.format) + ' \
                  <span class="caret"></span>\
               </span>');
				}

				$element
					.daterangepicker($scope.gridViewDateRange, function (start, end, label) {
						$scope.$apply(function () {
							$scope.gridViewDateRange.startDate = start;
							$scope.gridViewDateRange.endDate = end;
						});
					})
			}
		}
	});

angular.module("grid-view-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("templates/grid-view/_operations.tpl.html","<div class=\"btn-group btn-group-sm gv-operations\" role=\"group\" ng-if=\"(operations|filter:{multiple:true}).length\">\n  <div uib-dropdown class=\"btn-group btn-group-sm\">\n    <button uib-dropdown-toggle class=\"btn btn-default btn-sm btn-block\" ng-disabled=\"pending\">\n      <span ng-show=\"!operation\">Operation</span>\n      <span ng-show=\"operation\" ng-bind-html=\"operation.label\"></span>\n      <span class=\"caret\"></span>\n    </button>\n    <ul class=\"uib-dropdown-menu\">\n      <li ng-repeat=\"o in operations | filter:{multiple:true}\">\n        <a href ng-click=\"$parent[\'operation\'] = o;\">\n          <i class=\"{{o.icon}}\"></i> <span ng-bind-html=\"o.label\"></span>\n        </a>\n      </li>\n     <li role=\"separator\" class=\"divider\"></li>\n      <li>\n        <a href ng-click=\"operation = null;\">\n          Cancel\n        </a>\n      </li>\n    </ul>\n  </div>\n  <button ng-disabled=\"pending\" type=\"button\" class=\"btn btn-default\" ng-if=\"operation.multiple\" ng-click=\"makeMultipleOperation(operation)\">Apply</button>\n</div>\n");
$templateCache.put("templates/grid-view/_page-size.tpl.html","<div uib-dropdown class=\"gv-page-size-dropdown btn-group\" >\n  <button uib-dropdown-toggle class=\"btn btn-default btn-sm btn-block\" ng-disabled=\"pending\">\n    <span ng-bind-html=\"pagination.pageSize.name\"></span>\n    <span class=\"caret\"></span>\n  </button>\n  <ul class=\"uib-dropdown-menu\">\n    <li ng-repeat=\"variant in pagination.pageSizeVariants\">\n      <a href ng-click=\"$parent.$parent.pagination.pageSize = variant\">\n        <span ng-bind-html=\"variant.name\"></span>\n      </a>\n    </li>\n  </ul>\n</div>\n");
$templateCache.put("templates/grid-view/_pagination.tpl.html","  <uib-pagination\n    ng-if=\"rows.length\"\n    total-items=\"total\"\n    items-per-page=\"pagination.pageSize.value\"\n    ng-model=\"$parent.pagination.page\"\n    max-size=\"4\"\n    class=\"pagination-sm gv-pagination\"\n    direction-links=\"false\"\n    boundary-links=\"true\"\n    first-text=\"&laquo;\"\n    last-text=\"&raquo;\"\n    ng-disabled=\"pending\">\n  </uib-pagination>\n");
$templateCache.put("templates/grid-view/_summary.tpl.html","<div class=\"gv-summary\" ng-show=\"total\" ng-if=\"rows.length\">\n  Showing <b><span ng-bind=\"pagination.pageSize.value * (pagination.page - 1) + 1\"></span>-<span ng-bind=\"min(pagination.pageSize.value * pagination.page, total)\"></span></b> of\n  <b ng-bind=\"total\"></b>.\n</div>\n");
$templateCache.put("templates/grid-view/_table.tpl.html","<table class=\"gv-table table table-condensed table-striped table-bordered table-hover\">\n  <thead>\n    <tr>\n      <td ng-repeat=\"column in columns\">\n        <span class=\"gv-cell-check-all\" ng-if=\"column.type == \'checkbox\';\">\n          <input type=\"checkbox\" ng-model=\"selected.all\" ng-change=\"toggleAll(column)\" ng-disabled=\"pending\" />\n        </span>\n        <span class=\"gv-cell-caption\" ng-if=\"column.type == \'data\' && !column.sortable\">\n          <span ng-bind-html=\"column.label\"></span>\n          <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-sort-by-attributes\': sort[column.attribute] == \'asc\', \'glyphicon-sort-by-attributes-alt\': sort[column.attribute] == \'dec\'}\"></i>\n        </span>\n        <a href ng-disabled=\"pending\" class=\"gv-cell-caption\" ng-if=\"column.type == \'data\' && column.sortable\" ng-click=\"sortColumn(column)\">\n          <span ng-bind-html=\"column.label\"></span>\n          <i class=\"glyphicon\" ng-class=\"{\'glyphicon-sort-by-attributes\': sort[column.attribute] == \'asc\', \'glyphicon-sort-by-attributes-alt\': sort[column.attribute] == \'desc\'}\"></i>\n        </a>\n        <span class=\"gv-cell-caption\" ng-if=\"column.type == \'operations\'\" ng-bind-html=\"column.label\"></span>\n      </td>\n    </tr>\n  </thead>\n  <tbody>\n    <tr ng-repeat=\"row in rows\">\n      <td ng-repeat=\"column in columns\" bind-html-compile=\"column.template\"></td>\n    </tr>\n    <tr ng-if=\"!rows.length\">\n      <td colspan=\"{{columns.length}}\" class=\"text-center text-muted\">\n         <i class=\"glyphicon glyphicon-info-sign\"></i> No records found.\n      </td>\n   </tr>\n  </tbody>\n</table>\n");
$templateCache.put("templates/grid-view/grid-view.tpl.html","<div class=\"gv-container\">\n  <div class=\"row\">\n    <div class=\"col-xs-6\" ng-include=\"templates.operationsDropdown\"></div>\n    <div class=\"col-xs-offset-3 col-xs-3 text-right\" ng-include=\"templates.pageSizeDropdown\"></div>\n  </div>\n  <div class=\"row\">\n    <div class=\"col-xs-6 text-left\" ng-include=\"templates.summary\"></div>\n    <div class=\"col-xs-6 text-right\" ng-include=\"templates.pagination\"></div>\n  </div>\n  <div class=\"row\">\n    <div class=\"col-xs-12\" ng-include=\"templates.table\"></div>\n  </div>\n  <div class=\"row\">\n    <div class=\"col-xs-6 text-left\" ng-include=\"templates.summary\"></div>\n    <div class=\"col-xs-6 text-right\" ng-include=\"templates.pagination\"></div>\n  </div>\n</div>\n");
$templateCache.put("templates/grid-view/modal.tpl.html","<div class=\"modal-header\">\n   <h3 class=\"modal-title\">\n     <i class=\"{{icon}}\"></i>\n     {{title}}\n   </h3>\n</div>\n<div class=\"modal-body\" ng-bind-html=\"message\"></div>\n<div class=\"modal-footer\">\n   <button class=\"btn btn-primary\" type=\"button\" ng-click=\"$close(true)\">OK</button>\n   <button class=\"btn btn-warning\" type=\"button\" ng-click=\"$dismiss(false)\">No</button>\n</div>\n");
$templateCache.put("templates/grid-view/cell/boolean.tpl.html","<div class=\"text-center\">\n   <i ng-if=\"+row[column.attribute]\" class=\"text-success glyphicon glyphicon-ok-circle\" title=\"Yes\"></i>\n   <i ng-if=\"!+row[column.attribute]\" class=\"text-muted glyphicon glyphicon-ban-circle\" title=\"No\"></i>\n</div>\n");
$templateCache.put("templates/grid-view/cell/checkbox.tpl.html","<span><input ng-disabled=\"pending\" type=\"checkbox\" ng-model=\"selected.items[row[column.attribute]]\" /></span>\n");
$templateCache.put("templates/grid-view/cell/data.tpl.html","<span>{{row[column.attribute]}}</span>\n");
$templateCache.put("templates/grid-view/cell/date.tpl.html","<time class=\"gv-nowrap\">\n   <i class=\"glyphicon glyphicon-calendar\"></i>\n   {{row[column.attribute] * 1000 | date:\"dd.MM.yyyy\"}}\n</time>\n");
$templateCache.put("templates/grid-view/cell/datetime.tpl.html","<time class=\"gv-nowrap text-right\">\n   <i class=\"glyphicon glyphicon-calendar\"></i> {{row[column.attribute] * 1000 | date:\"dd.MM.yyyy\"}}\n   <br/>\n   <small class=\"gv-nowrap\">{{row[column.attribute] * 1000 | date:\"HH:mm:ss\"}}</small>\n</time>\n");
$templateCache.put("templates/grid-view/cell/email.tpl.html","<a ng-href=\"{{\'mailto:\' + row[column.attribute]}}\" class=\"gv-nowrap\">\n   {{row[column.attribute]}}\n</a>\n");
$templateCache.put("templates/grid-view/cell/img.tpl.html","<p class=\"text-center\">\n  <img ng-src=\"{{row[column.attribute]}}\" class=\"img-responsive\" />\n</p>\n");
$templateCache.put("templates/grid-view/cell/operations.tpl.html","<div class=\"btn-group btn-group-sm gv-operations-group\">\n  <button class=\"btn btn-default\"\n          type=\"button\"\n          ng-repeat=\"operation in operations\"\n          ng-if=\"operation.single && operation.condition(row)\"\n          title=\"{{operation.label}}\"\n          ng-disabled=\"pending\"\n          ng-click=\"makeSingleOperation(operation, row)\">\n    <i class=\"{{operation.icon}}\"></i>\n  </button>\n</div>\n");
$templateCache.put("templates/grid-view/filter/autocomplete.tpl.html","<ui-select ng-model=\"filter[column.attribute]\" theme=\"select2\" class=\"form-control input-sm\" title=\"{{column.label}}\" append-to-body=\"false\" ng-disabled=\"pending\" theme=\"bootstrap\">\n   <ui-select-match placeholder=\"{{column.label}}\">{{$select.selected.label}}</ui-select-match>\n   <ui-select-choices repeat=\"option.value as option in options | filter: $select.search\">\n      <div ng-bind-html=\"option.label | highlight: $select.search\"></div>\n   </ui-select-choices>\n</ui-select>\n");
$templateCache.put("templates/grid-view/filter/date-range.tpl.html","<button type=\"button\" class=\"btn btn-default btn-sm\" grid-view-date-range=\"range\" ng-disabled=\"pending\"></button>\n");
$templateCache.put("templates/grid-view/filter/dropdown.tpl.html","<ui-select ng-model=\"filter[column.attribute]\" theme=\"select2\" class=\"gv-dropdown form-control input-sm\" title=\"{{column.label}}\" append-to-body=\"false\" ng-disabled=\"pending\" theme=\"bootstrap\" search-enabled=\"false\">\n   <ui-select-match placeholder=\"{{column.label}}\">{{$select.selected.label}}</ui-select-match>\n   <ui-select-choices repeat=\"option.value as option in options | filter: $select.search\">\n      <div ng-bind-html=\"option.label | highlight: $select.search\"></div>\n   </ui-select-choices>\n</ui-select>\n");
$templateCache.put("templates/grid-view/filter/select.tpl.html","<div class=\"gv-select-filter\">\n  <select class=\"form-control input-sm\"\n         ng-disabled=\"pending\"\n          ng-model=\"filter[column.attribute]\"\n          ng-options=\"option.value as option.label for option in options\"></select>\n</div>\n");
$templateCache.put("templates/grid-view/filter/text.tpl.html","<div class=\"gv-text-filter\">\n  <input type=\"text\"\n      ng-disabled=\"pending\"\n        class=\"form-control input-sm\"\n        ng-model=\"filter[column.attribute]\"\n        ng-model-options=\"{debounce: 1000}\"\n        placeholder=\"{{column.label}}\"/>\n</div>\n");}]);