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
