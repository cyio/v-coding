'use strict';

/* global Zepto*/

(function (window, $, undefined) {

	var CODING_HOST = 'https://coding.net';

	var SERVICES = {
		mongodb: 'mongodb',
		fs: 'filesystem',
		mysql: 'mysql'
	};

	function noop() {
	};

	var ajax = function (url, callback, method, data) {
		return $.ajax({
			type: method || 'GET',
			url: url,
			async: !!callback,
			success: callback,
			data: data || {},
			error: function (xhr) {
				var data = {};
				try {
					data = $.parseJSON(xhr.responseText || {});
				} catch (e) {
					data = {error: 1, message: 'responseText parse error'};
				} finally {
					if (callback) {
						callback(data);
					}
				}
			}
		}).responseText;
	};

	var get = function (url, callback) {
		return ajax(url, callback, 'GET')
	};

	var post = function (url, callback, data) {
		return ajax(url, callback, 'POST', data);
	};

	var del = function (url, callback) {
		return ajax(url, callback, 'DELETE');
	};

	var currentUser = function (callback) {
		var url = [CODING_HOST, '/api/current_user'].join('');
		return get(url, callback);
	};

	var projects = function (type, callback) {
		var url = [CODING_HOST, '/api/projects?pageSize=1000'].join('');
		return get(url, function loadAllProjects(result) {
			if (result.code) {
				if (callback) {
					return callback(result);
				}
			}
			var projects = result.data && result.data.list;
			projects = $.map(projects, function (project) {
				if (type === 'public') {
					/*jshint camelcase: false */
					return project.is_public ? project : undefined;
				}
				if (type === 'private') {
					return !project.is_public ? project : undefined;
				}
				return project;
			});
			if (callback) {
				projects.code = 0;
				callback(projects);
			}
		});
	};

	var paasHealth = function (username, projectName, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_app/health'].join('');
		return get(url, callback);
	};

	var paas = function (username, projectName, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_app'].join('');
		return get(url, callback);
	};

	var paasStats = function (username, projectName, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_app/stats'].join('');
		return get(url, callback);
	};

	var paasPlayer = function (username, projectName, action, callback) {
		var deployRef = (action === 'deploy' ? '?ref=master' : '');
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_app/', action, deployRef].join('');
		return post(url, callback);
	};

	var deletePaas = function (username, projectName, password, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_app?password=', password].join('');
		return del(url, callback);
	};

	var avaServices = function (username, projectName, serviceType, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_services/avaliable'].join('');
		return get(url, function (services) {
			if (callback) {
				callback($.map(services, function (service) {
					return (service.label === serviceType || typeof serviceType === 'undefined') ? service : undefined;
				}));
			}
		});
	};

	var services = function (username, projectName, serviceType, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_services'].join('');
		return get(url, function (services) {
			if (callback) {
				callback($.map(services, function (service) {
					return (service.label === serviceType || typeof serviceType === 'undefined') ? service : undefined;
				}));
			}
		});
	};

	var createServiceInstance = function (username, projectName, guid, name, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_services'].join('');
		return post(url, callback, {
			guid: guid,
			name: name
		});
	};

	var bindServiceInstance = function (username, projectName, serviceId, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_services/', serviceId, '/bind'].join('');
		return post(url, callback);
	};

	var createAndBindService = function (username, projectName, serviceGuid, serviceName, callback) {
		createServiceInstance(username, projectName, serviceGuid, serviceName, function (service) {
			bindServiceInstance(username, projectName, service.id, callback);
		});
	};

	var serviceCredentials = function (username, projectName, serviceId, callback) {
		var url = [CODING_HOST, '/api/paas/', username, '/', projectName, '/cf_services/', serviceId, '/credentials'].join('');
		return get(url, callback);
	};

	var sort = function (array, sortBy) {
		var first = [],
			second = [];
		$.each(array, function (i, item) {
			if (sortBy(item)) {
				first.push(item);
			} else {
				second.push(item);
			}
		});
		return first.concat(second);
	};

	var share = function (content, callback) {
		var url = [CODING_HOST, '/api/tweet'].join('');
		return post(url, callback, {
			content: content
		});
	};

	var removeProjectActivityCount = function (id, callback) {
		var url = [CODING_HOST, '/api/project/', id, '/update_visit'].join('');
		return get(url, callback);
	};

	var removeActivityCount = function (projectIds, callback) {
		var counts = 0;
		var cbk = function () {
			counts++;
			if (counts === projectIds.length && callback) {
				callback();
			}
		};
		$.each(projectIds, function (i, id) {
			removeProjectActivityCount(id, cbk);
		});
		if (projectIds.length === 0 && callback) {
			callback();
		}
	};

	var randomID = function () {
		return Math.random().toString(36).substring(2);
	};

	var API = {
		sort: sort,
		get: get,
		paas: paas,
		health: paasHealth,
		stats: paasStats,
		me: currentUser,
		projects: projects,
		deletePaas: deletePaas,
		services: services,
		avaServices: avaServices,
		createAndBindService: createAndBindService,
		createServiceInstance: createServiceInstance,
		bindServiceInstance: bindServiceInstance,
		serviceCredentials: serviceCredentials,
		SERVICES: SERVICES,
		player: function (username, projectName) {
			return paasPlayer.bind(this, username, projectName);
		},
		share: share,
		removeCount: removeActivityCount,
		host: CODING_HOST,
		randomID: randomID
	};

	window.CodingAPI = API;

})(window, Zepto);