angular.module('angular-grid-view')
	.run(function(gridView)
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
	})
