var myApp = angular.module('myApp', ['ngRoute', 'mainController']);

myApp.config(function($logProvider, $routeProvider) {

	// Deaktiviert alle $log
	$logProvider.debugEnabled(false);

	$routeProvider

	.when('/', {
		templateUrl : 'templates/main.html',
	})

	.otherwise({
		redirectTo : '/',
	});
})
