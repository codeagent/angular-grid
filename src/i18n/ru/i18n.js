angular.module('angular-grid-view')
	.config(["gridViewProvider", function (gridViewProvider) {
		moment.locale('ru');
		gridViewProvider.operationsColumnConfig.label = 'Операции';
		gridViewProvider.operationConfig.label = 'Операция';
		gridViewProvider.promptConfig.label = 'Операция';
		gridViewProvider.promptConfig.prompt.title = 'Операция';
		gridViewProvider.promptConfig.prompt.message = 'Выполнить эту операцию?';

		gridViewProvider.defaultTemplates.modal = 'templates/grid-view/ru/modal.tpl.html';
		gridViewProvider.defaultTemplates.operationsDropdown = 'templates/grid-view/ru/_operations.tpl.html';
		gridViewProvider.defaultTemplates.summary = 'templates/grid-view/ru/_summary.tpl.html';
		gridViewProvider.defaultTemplates.table = 'templates/grid-view/ru/_table.tpl.html';
	}])
	.run(["gridView", function (gridView) {
		gridView
			.filter('boolean',
				{
					templateUrl: 'templates/grid-view/filter/select.tpl.html',
					controller:  ['$scope', function ($scope) {
						$scope.options = [
							{
								'value': undefined,
								'label': 'Все'
							},
							{
								'value': 1,
								'label': 'Да'
							},
							{
								'value': 0,
								'label': 'Нет'
							}
						];
					}]
				})
			.filter('daterange',
				{
					templateUrl: 'templates/grid-view/filter/date-range.tpl.html',
					controller:  ['$scope', function ($scope) {

						$scope.range = {
							ranges: {
								'\u0421\u0435\u0433\u043e\u0434\u043d\u044f':              [moment(), moment()],
								'\u0412\u0447\u0435\u0440\u0430':             [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
								'\u0417\u0430 \u043d\u0435\u0434\u0435\u043b\u044e': [moment().subtract(6, 'days'), moment()],
								'\u0417\u0430 30 \u0434\u043d\u0435\u0439':          [moment().subtract(29, 'days'), moment()],
								'\u0417\u0430 \u043f\u043e\u043b\u0433\u043e\u0434\u0430': [moment().subtract(6, 'months'), moment()],
								'\u0412\u0441\u0435 \u0432\u0440\u0435\u043c\u044f':       [moment('2000-01-01'), moment()]
							},
							locale: {
								format:           'DD.MM.YYYY',
								separator:        ' - ',
								applyLabel:       'Применить',
								cancelLabel:      'Отмена',
								weekLabel:        'W',
								customRangeLabel: 'Выбрать диапазон',
								daysOfWeek:       moment.weekdaysMin(),
								monthNames:       moment.monthsShort(),
								firstDay:         moment.localeData().firstDayOfWeek()
							}
						};

						$scope.$watchGroup(['range.startDate', 'range.endDate'], function (n, o) {
							if (!o[0] || !o[1])
								return;

							$scope.filter[$scope.column.attribute] = {
								from: parseInt(n[0].format('x') / 1000),
								to:   parseInt(n[1].format('x') / 1000),
							};
						}, true);
					}]
				})
	}]);