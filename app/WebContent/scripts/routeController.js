var routeController = angular.module('mainController',
		['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'locationFactory', 'googleMapsService', 'calculationService']);

/*
 * ############################### routeCtrl ############################################################
 * #																									#
 * #	Is loaded by index.html																			#
 * #																									#
 * ######################################################################################################
*/

routeController.controller('mainCtrl', function($rootScope, $scope, $log, $window, locationFact, googleMapsService, calculationService) {

	// general variables
	$rootScope.locations = [];
	$scope.finalWays = [];
	$scope.startLocation;
	$scope.destinationLocation;

	// for loadingbar
	$scope.loadBarMax;
	$scope.calculatedRoutes = 0;
	var broadcastChannel = new BroadcastChannel('worker');

	// for sidebar
	$scope.startCalculation = false;
	$scope.calculatedAllRoutes = true;

	googleMapsService.initialize("map", "listWayPoints", "googleMapsSearch", 48.135125, 11.581981);

	/*
	 * ############################### scope functions for frontend #########################################
	 * #																									#
	 * #	Different functions for the frontend															#
	 * #																									#
	 * ######################################################################################################
	*/

	/*
	 * Deletes a location from the $rootScope.locations array
	 * and clean the routinmaps from the other locations
	 * param value: location(locationFact object) to remove
	 */
	$scope.deleteLocation = function(value) {
		removeLocationsEntry($rootScope.locations, value);
		locationFact.deleteRouteMapEntry(value, $rootScope.locations)
		setPossibilyStartAndDestinationLocation(value)
	}

	/*
	 * Set the $scope.startLocation
	 * @param value: new start location (locationFact object)
	 */
	$scope.setStartLocation = function(value) {
		$scope.startLocation = value;
		calculationService.setOriginLocation(value);
	}

	/*
	 * Set the $scope.destinationLocation
	 * @param value: new destination location (locationFact object)
	 */
	$scope.setDestinationLocation = function(value) {
		$scope.destinationLocation = value;
		calculationService.setDestinationLocation(value);
	}

	/*
	 * Start calculating the shortest route
	 */
	$scope.calculateRoute = function() {
		showWaitingWindowAndDisableCalculationButton()
		calculationService.calculateAllRoutes(function(data) {
			var shortestWays = data;
			hideWaitingWindowAndEnableCalculationButton();
			googleMapsService.showShortestWays(shortestWays);
		})
	}

	/*
	 * ############################### Monitoring events ####################################################
	 * #																									#
	 * #	Monitoring some events 																			#
	 * #																									#
	 * ######################################################################################################
	*/

	/*
	 * Monitoring if a new Location was elected and add this location to $rootScope.locations 
	 * and update the routingMaps of the other locations
	 */
	$scope.$on('newLocationElected', function() {
		var googlePlace = googleMapsService.getNewLocation();
		if (googlePlace.length == 1) {
			addNewLocationToScope(googlePlace);
		} else {
			bootbox.alert("Die Suche war nicht eindeutig. Bitte erneut versuchen.");
		}
	});

	/*
	 * Monitoring the currently calculated route for the loadBar
	 */
	broadcastChannel.onmessage = function(event) {
		$scope.calculatedRoutes = event.data;
		$scope.$apply();
	}

	/*
	 * ############################### Functions ############################################################
	 * #																									#
	 * #	Needed functions in the controller																#
	 * #																									#
	 * ######################################################################################################
	*/

	/*
	 * Add a new location to $rootScope.locations
	 */
	function addNewLocationToScope(googlePlace) {
		var location = new locationFact(googlePlace[0], googlePlace[0].formatted_address)
		if ($rootScope.locations.length == 0) {
			$scope.setStartLocation(location);
			$scope.setDestinationLocation(location);
		}
		if (!containsLocation($rootScope.locations, location.locationName)) {
			$rootScope.locations.push(location);
			setDistanceMaps(location);
			$scope.$apply();
		} else {
			bootbox.alert("Das Hinzufügen eines schon vorhandenen Ortes ist nicht erlaubt!");
		}
	}

	/*
	 * Set new start and destination locations if the old ones are removed
	 */
	function setPossibilyStartAndDestinationLocation(value) {
		if (value == $scope.startLocation) {
			if ($rootScope.locations.length > 0) {
				$scope.startLocation = $rootScope.locations[0]
				calculationService.setOriginLocation($rootScope.locations[0]);
			} else {
				$scope.startLocation = [];
				calculationService.setOriginLocation([])
			}
		}
		if (value == $scope.destinationLocation) {
			if ($rootScope.locations.length > 0) {
				$scope.destinationLocation = $rootScope.locations[0]
				calculationService.setDestinationLocation($rootScope.locations[0]);
			} else {
				$scope.destinationLocation = [];
				calculationService.setDestinationLocation([]);
			}
		}
	}

	/*
	 * Displays the waiting window with the loadbar and the iframe and disable the calculate button
	 */
	function showWaitingWindowAndDisableCalculationButton() {
		if ($rootScope.locations.length > 7) {
			$scope.startCalculation = true;
			if ($scope.startLocation == $scope.destinationLocation) {
				$scope.loadBarMax = faculty($rootScope.locations.length - 1)
			} else {
				$scope.loadBarMax = faculty($rootScope.locations.length - 2)
			}

			$scope.calculationIsFinished = false;
			$scope.calculatedAllRoutes = false;
		}
	}

	/*
	 * Hide the waiting window with the loadbar and the iframe and enable the calculate button
	 */
	function hideWaitingWindowAndEnableCalculationButton() {
		$scope.calculationIsFinished = true;
		$scope.startCalculation = false;
		$scope.calculatedAllRoutes = true;
		$scope.$apply();
	}

	/*
	 * Update the routing maps of all locations
	 * @param location: new added loaction (locationFact object) to $rootScope.locations
	 */
	function setDistanceMaps(location) {

		// enable calculate button
		$scope.$apply(function() {
			$scope.calculatedAllRoutes = false;
		})

		if ($rootScope.locations.length > 1) {
			var countOfDistance = 0;
			for (var i = 0; i < $rootScope.locations.length - 1; i++) {
				$log.debug("locations", location)
				distance = googleMapsService.getDistance(location, $rootScope.locations[i], function(distance, originLocation, destinationLocation) {
					countOfDistance++;
					originLocation.routingMap[destinationLocation.locationName] = distance;
					destinationLocation.routingMap[originLocation.locationName] = distance;
					if (countOfDistance == $rootScope.locations.length - 1) {
						$scope.$apply(function() {
							$scope.calculatedAllRoutes = true;
						})
					}
				});
			}
		}
	}
})