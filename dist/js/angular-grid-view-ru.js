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
angular.module("angular-grid-view").run(["$templateCache", function($templateCache) {$templateCache.put("templates/grid-view/ru/_operations.tpl.html","<div class=\"btn-group btn-group-sm gv-operations\" role=\"group\" ng-if=\"(operations|filter:{multiple:true}).length\">\n  <div uib-dropdown class=\"btn-group btn-group-sm\">\n    <button uib-dropdown-toggle class=\"btn btn-default btn-sm btn-block\" ng-disabled=\"pending\">\n      <span ng-show=\"!operation\">Операции</span>\n      <span ng-show=\"operation\" ng-bind-html=\"operation.label\"></span>\n      <span class=\"caret\"></span>\n    </button>\n    <ul class=\"uib-dropdown-menu\">\n      <li ng-repeat=\"o in operations | filter:{multiple:true}\">\n        <a href ng-click=\"$parent[\'operation\'] = o;\">\n          <i class=\"{{o.icon}}\"></i> <span ng-bind-html=\"o.label\"></span>\n        </a>\n      </li>\n     <li role=\"separator\" class=\"divider\"></li>\n      <li>\n        <a href ng-click=\"operation = null;\">\n          Отмена\n        </a>\n      </li>\n    </ul>\n  </div>\n  <button ng-disabled=\"pending\" type=\"button\" class=\"btn btn-default\" ng-if=\"operation.multiple\" ng-click=\"makeMultipleOperation(operation)\">Применить</button>\n</div>\n");
$templateCache.put("templates/grid-view/ru/_summary.tpl.html","<div class=\"gv-summary\" ng-show=\"total\" ng-if=\"rows.length\">\n  Показано <b><span ng-bind=\"pagination.pageSize.value * (pagination.page - 1) + 1\"></span>-<span ng-bind=\"min(pagination.pageSize.value * pagination.page, total)\"></span></b> из\n  <b ng-bind=\"total\"></b>.\n</div>\n");
$templateCache.put("templates/grid-view/ru/_table.tpl.html","<table class=\"gv-table table table-condensed table-striped table-bordered table-hover\">\n  <thead>\n    <tr>\n      <td ng-repeat=\"column in columns\">\n        <span class=\"gv-cell-check-all\" ng-if=\"column.type == \'checkbox\';\">\n          <input type=\"checkbox\" ng-model=\"selected.all\" ng-change=\"toggleAll(column)\" ng-disabled=\"pending\" />\n        </span>\n        <span class=\"gv-cell-caption\" ng-if=\"column.type == \'data\' && !column.sortable\">\n          <span ng-bind-html=\"column.label\"></span>\n          <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-sort-by-attributes\': sort[column.attribute] == \'asc\', \'glyphicon-sort-by-attributes-alt\': sort[column.attribute] == \'dec\'}\"></i>\n        </span>\n        <a href ng-disabled=\"pending\" class=\"gv-cell-caption\" ng-if=\"column.type == \'data\' && column.sortable\" ng-click=\"sortColumn(column)\">\n          <span ng-bind-html=\"column.label\"></span>\n          <i class=\"glyphicon\" ng-class=\"{\'glyphicon-sort-by-attributes\': sort[column.attribute] == \'asc\', \'glyphicon-sort-by-attributes-alt\': sort[column.attribute] == \'desc\'}\"></i>\n        </a>\n        <span class=\"gv-cell-caption\" ng-if=\"column.type == \'operations\'\" ng-bind-html=\"column.label\"></span>\n      </td>\n    </tr>\n  </thead>\n  <tbody>\n    <tr ng-repeat=\"row in rows\">\n      <td ng-repeat=\"column in columns\" bind-html-compile=\"column.template\"></td>\n    </tr>\n    <tr ng-if=\"!rows.length\">\n      <td colspan=\"{{columns.length}}\" class=\"text-center text-muted\">\n         <i class=\"glyphicon glyphicon-info-sign\"></i> Нет записей.\n      </td>\n   </tr>\n  </tbody>\n</table>\n");
$templateCache.put("templates/grid-view/ru/modal.tpl.html","<div class=\"modal-header\">\n   <h3 class=\"modal-title\">\n     <i class=\"{{icon}}\"></i>\n     {{title}}\n   </h3>\n</div>\n<div class=\"modal-body\" ng-bind-html=\"message\"></div>\n<div class=\"modal-footer\">\n   <button class=\"btn btn-primary\" type=\"button\" ng-click=\"$close(true)\">Да</button>\n   <button class=\"btn btn-warning\" type=\"button\" ng-click=\"$dismiss(false)\">Нет</button>\n</div>\n");}]);