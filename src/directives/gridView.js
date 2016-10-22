angular.module('angular-grid-view')
	.directive('gridView', function(gridView, $compile, $injector, $q, $timeout) {

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
	});
