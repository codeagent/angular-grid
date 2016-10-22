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

		this.$get = function($q, $http, $templateCache, $injector, gridViewService, $uibModal, $rootScope, $compile)
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
		};
	});
