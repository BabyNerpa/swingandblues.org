var projectModule = angular.module('project',[]);

projectModule.config(function($routeProvider) {
	$routeProvider.
	when('/', {controller:PersonCtrl, templateUrl:'1.html'}).
	when('/2', {controller:WrapupCtrl, templateUrl:'2.html'}).
	when('/payment', {controller:BaseCtrl, templateUrl:'payment.html'}).
	when('/payment/success', {controller:BaseCtrl, templateUrl:'thanks.html'}).
	when('/payment/soldout', {controller:BaseCtrl, templateUrl:'soldout.html'}).
	when('/full', {controller:FullCtrl, templateUrl:'full.html'}).
	when('/error', {controller:BaseCtrl, templateUrl:'error.html'}).	
	otherwise({redirectTo:'/'});
});


projectModule.factory('personService', function() {  

	// Defaults. Also useful if you don't want to crash
	// when checking property values.
	return {
		person : {
			dancer : {
				role : "mystery",
				"canHaz": false
			},
			payment : {
				method : "never"
			},
			"travel": {
				"train": false,
				"carpool": false,
				"zip": ""
  			},
  			"housing": {
				"host": false,
				"guest": false
  			},
  			"shirt": {
				"want": false
  			},
  			"volunteer": {
				"want": false
  			}
		}
	};
});

// We call this instead of jQuery's document.ready,
// because it doesn't work that way if we're using
// Angular templates / routes.
//
// TODO: It has been suggested that the Angular way
// is to use a 'directive' instead. Well, this works
// as is, so feel free to figure that out, future-self.
function initController($scope, $location, $window) {
	$scope.$on('$viewContentLoaded', function() {		
		main();
		$window._gaq.push(['_trackPageview', $location.path()]);
	});
}

function FullCtrl($scope, $location, $window, $http) {
	initController($scope, $location, $window);

	var limit = $http.get('/data/attendance/limit/')
	.success(function(limit) {
		$scope.limit = limit;
	});
}

function PersonCtrl($scope, $location, $window, $http, personService) {
	initController($scope, $location, $window);

	// TODO: There is probably a better place for this, to
	// do things the 'Angular' way. Figure that out, future self.
	var remaining = $http.get('/data/attendance/remaining/')
	.success(function(remaining) {
		if (remaining > 0) {
			// Do nothing. We're fine.
		}
		else {
			// We're sold out. Redirect.
			$location.path('/full');
		}
	});


	$scope.person = personService.person;
	$scope.frowns = {		
		name : "",
		email : "",
		role : ""
	};

	$scope.onward = function() {		
		personService.person = $scope.person;

		var person = $scope.person;
		var frowns = $scope.frowns;

		// Frown if name or email is empty.
		frowns.name = !person.name ? true : "";
		frowns.email = !person.email ? true : "";

		// Frown if dancer role is default
		frowns.role = person.dancer.role === "mystery" ? true : "";

		// If we have a frown, don't navigate.
		for (frown in frowns) {
			if (frowns[frown]) {				
				showInvalidFormTip();
				return;
			}
		}

		$location.path("/2");	
	};

	$scope.removeFrown = function (frown) {
		if ($scope.frowns[frown]) {
			$scope.frowns[frown] = "";	
		}

		hideInvalidFormTip();
	}
}


function WrapupCtrl($scope, $http, $location, $window, personService) {
	initController($scope, $location, $window);
	$scope.person = personService.person; 
	$scope.frowns = {
		canHaz : "",
		payment : ""
	};
	$scope.submitCount = 0;
	$scope.isSubmitting = false;

	var doneSubmitting = function() {
		$scope.isSubmitting = false;
		$scope.submitCount = 0;
	};

	$scope.submit = function() {
		$scope.submitCount++;
		if ($scope.isSubmitting) {
			return;
		}

		$scope.isSubmitting = true;
		personService.person = $scope.person;	
		
		// Form validation checking.
		var person = $scope.person;
		var frowns = $scope.frowns;

		frowns.canHaz = !person.dancer.canHaz ? true : "";
		frowns.payment = person.payment.method === "never" ? true : "";

		// If we have a frown, don't navigate.
		for (frown in frowns) {
			if (frowns[frown]) {				
				showInvalidFormTip();
				doneSubmitting();
				return;
			}
		}

		// Otherwise, submit that form.		
		var res = $http.put('/rsvp/submit/', $scope.person);
		res.success(function() {
			// The server is happy.
			$location.path("/payment");
			doneSubmitting();
		});

		res.error(function(data, status, headers, config) {			
			console.log(data);
			$location.path("/error");
			doneSubmitting();
		});				
		
// For testing ...		
//		$location.path("/payment");
	};

	// TODO: Figure out a cool way to avoid duplication.
	$scope.removeFrown = function (frown) {
		if ($scope.frowns[frown]) {
			$scope.frowns[frown] = "";	
		}

		hideInvalidFormTip();
	}
}


function BaseCtrl($scope, $location, $window, personService) {
	initController($scope, $location, $window);
	$scope.person = personService.person; 
}
