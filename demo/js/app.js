angular
	.module('app', ['angular-grid-view'])

	.constant('Status',
		{
			'APPROVED': 1,
			'PENDING' : 0
		})

	.constant('Icons', {
		'Avatar'  : 'glyphicon glyphicon-picture',
		'Calendar': 'glyphicon glyphicon-calendar',
		'Time'    : 'glyphicon glyphicon-time',
	})

	.factory('Users', function ($timeout, $q) {
		var users = {
			'1' : {'name': 'Kaya', 'email': 'aberge@west.com'},
			'2': {'name': 'Kaelyn', 'email': 'acormier@windler.com'},
			'3': {'name': 'Carlo', 'email': 'adelia.lemke@thompson.net'},
			'4': {'name': 'Cortez', 'email': 'adriana.gibson@hotmail.com'},
			'5': {'name': 'Nestor', 'email': 'adriel53@yahoo.com'},
			'6': {'name': 'Virgil', 'email': 'agustin.kiehn@baumbach.biz'},
			'7': {'name': 'Stevie', 'email': 'ahermann@hotmail.com'},
			'8': {'name': 'Cassidy', 'email': 'ajohnson@gmail.com'},
			'9': {'name': 'Kaia', 'email': 'akeem95@hintz.info'},
			'10': {'name': 'Holly', 'email': 'akoch@hotmail.com'}
		}, delay  = 400;
		return {
			get   : function (id) {
				return $q(function (resolve, reject) {
					$timeout(function () {
						resolve(users[id]);
					}, delay);
				});
			},
			list: function () {
				return $q(function (resolve, reject) {
					$timeout(function () {
						resolve(users);
					}, delay);
				});
			},
			cached: function () {
				return users;
			}
		}
	})

	.filter('user', function (Users) {
		return function (id) {
			var user = Users.cached()[id];
			return "<span>" + user.name + "</span><br/>\
               <small>\
                  <<span>" + user.email + "</span>>\
               </small>";
		}
	})

	.constant('ColumnsDefault', [
		{
			attribute: 'id'
		},
		{
			attribute: 'avatar'
		},
		{
			attribute: 'firstname'
		},
		{
			attribute: 'lastname'
		},
		{
			attribute: 'email'
		},
		{
			attribute: 'status'
		},
		{
			attribute: 'updated_at'
		},
		{
			attribute: 'created_at'
		},
		{
			attribute: 'updated_by'
		},
		{
			attribute: "role"
		}])

	.constant('ColumnsCustom', [
		{
			attribute: 'id',
			type     : 'checkbox'
		},
		{
			attribute: 'id',
			label    : 'ID',
			sortable : false,
			filter   : false
		},
		{
			attribute  : 'avatar',
			label    : ['Icons', function (Icons) {
				return "<i class='" + Icons.Avatar + "'></i> Avatar"
			}],
			templateUrl: 'templates/grid-view/cell/img.tpl.html',
			filter     : false,
			sortable   : false
		},
		{
			attribute: 'firstname',
			label    : 'First Name'
		},
		{
			attribute: 'lastname',
			label    : 'Last Name',
			template : function () {
				return '<span>{{row[column.attribute]}}</span>';
			}
		},
		{
			attribute  : 'email',
			templateUrl: 'templates/grid-view/cell/email.tpl.html'
		},
		{
			attribute  : 'status',
			filter   : 'boolean',
			templateUrl: function () {
				return 'templates/grid-view/cell/boolean.tpl.html';
			}
		},
		{
			attribute  : 'updated_at',
			label    : ['Icons', function (Icons) {
				return "<i class='" + Icons.Calendar + "'></i> Updated"
			}],
			templateUrl: 'templates/grid-view/cell/date.tpl.html',
			filter     : 'daterange'
		},
		{
			attribute  : 'created_at',
			label    : 'Created',
			templateUrl: 'templates/grid-view/cell/datetime.tpl.html',
			filter     : 'daterange'
		},
		{
			attribute: 'updated_by',
			filter   : 'user',
			label    : 'Editor',
			template : '<span ng-bind-html="row[column.attribute] | user"></span>'
		},
		{
			attribute: "role",
			filter   : 'role',
			template : function () {
				var ngClass = "\
            'label-danger': row[column.attribute] == 'admin', \
            'label-primary': row[column.attribute] == 'moderator', \
            'label-default': row[column.attribute] == 'user' \
         ";
				return '<div class="text-center">\
                     <span class="label" \
                        ng-class="{' + ngClass + '}"> \
                        {{row[column.attribute]}} \
                     </span>\
                  </div>';
			}
		}
	])

	// Register components
	.run(function (gridView) {
		gridView
			.service('default',
				{
					url          : '/demo/api/',
					filterParam: 'filter',
					pageParam  : 'page',
					pageSizeParam: 'page-size',
					sortParam    : 'sort',
					format       : function (response) {
						return {
							items: response.data,
							total: response.headers('X-Pagination-Total-Count')
						}
					}
				})

	})

	// Default minimal configuration
	.run(function (gridView, ColumnsDefault) {
		gridView
			.grid('minimal',
				{
					service: {
						url: '/demo/api/'
					},
					columns: ColumnsDefault
				})
	})

	// Custom Grid configuration
	.run(function (gridView, ColumnsDefault) {
		gridView
			.grid('custom',
				{
					service   : 'default',
					columns: ColumnsDefault,
					sort   : {
						created_at: 'desc',
						firstname : 'asc'
					},
					filter : {
						email: '@gmail.com'
					},
					pagination: {
						pageSize        : 5,
						page    : 4,
						pageSizeVariants: [
							{
								name : 'Single',
								value: 1
							},
							{
								name : 'Five',
								value: 5
							},
							{
								name : 'Ten',
								value: 10
							}]
					}
				})
	})

	// Custom Column configuratin
	.run(function (gridView, ColumnsCustom) {
		gridView
			.filter('role', {
				templateUrl: 'templates/grid-view/filter/dropdown.tpl.html',
				controller : ['$scope', function ($scope) {
					$scope.options = [
						{
							'value': undefined,
							'label': 'All roles'
						},
						{
							'value': 'admin',
							'label': 'Admin'
						},
						{
							'value': 'moderator',
							'label': 'Moderator'
						},
						{
							'value': 'user',
							'label': 'User'
						},
					];
				}]
			})
			.filter('user', {
				templateUrl: 'templates/grid-view/filter/autocomplete.tpl.html',
				controller : ['$scope', 'Users', function ($scope, Users) {
					$scope.options = [
						{
							'value': undefined,
							'label': '-Any-'
						}
					];
					Users
						.list()
						.then(function (users) {
							angular.forEach(users, function (u, id) {
								$scope.options.push({value: id, label: u.name})
							});
						})
				}]
			})
			.grid('column',
				{
					service: 'default',
					columns: ColumnsCustom
				})
	})

	// Custom grid Operations
	.run(function (gridView, ColumnsCustom, $uibModal, $rootScope, Status) {
		ColumnsCustom.splice(9, 1);
		gridView
			.prompt('approve', {
				icon        : 'glyphicon glyphicon-ok-circle',
				label: 'Approve',
				condition: function (target) {
					return target.status != Status.APPROVED;
				},
				make     : function (target) {
					if (angular.isArray(target))
						angular.forEach(target, function (t) {
							t.status = Status.APPROVED;
						})
					else
						target.status = Status.APPROVED;
				},
				prompt   : {
					enabled: true,
					title  : "Approve",
					message: "Approve selected item(s)?"
				},
				multiple : true,
				single   : true,
				reloadOnDone: false
			})
			.prompt('pending', {
				icon        : 'glyphicon glyphicon-ban-circle',
				label: 'Pending',
				condition: function (target) {
					return target.status != Status.PENDING;
				},
				make     : function (target) {
					if (angular.isArray(target))
						angular.forEach(target, function (t) {
							t.status = Status.PENDING;
						})
					else
						target.status = Status.PENDING;
				},
				prompt   : {
					enabled: false
				},
				multiple : true,
				reloadOnDone: true
			})
			.grid('operation',
				{
					service   : 'default',
					columns: ColumnsCustom.concat(
						{
							type: 'operations'
						}),
					operations: [
						{
							label       : [function () {
								return 'Demo'
							}],
							icon : 'glyphicon glyphicon-fire',
							make : function (target) {
								var $scope = $rootScope.$new();
								$scope.icon = this.icon;
								$scope.title = 'Demo operation';
								$scope.message = 'This is demo operation.<br/>Make it?';

								return $uibModal
									.open({
										scope      : $scope,
										templateUrl: 'templates/grid-view/modal.tpl.html'
									})
									.result
									.then(function () {
										alert('You just have made operation.')
									});
							},
							condition: function (target) {
								return target.status == Status.APPROVED;
							},
							multiple : false,
							single   : true,
							reloadOnDone: false
						},
						'approve',
						'pending'
					]
				})
	});
