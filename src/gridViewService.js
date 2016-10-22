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

		this.$get = function($http, $injector) {

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
		};
	});
