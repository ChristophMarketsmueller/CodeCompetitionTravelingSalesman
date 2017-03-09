var googleMap = angular.module("googleMapsService", []);

/*
 * The googleMapsService handle and interact with the google maps api.
 * The Service provides the following functions:
 * - initialize(mapId, listId, searchBoxId, lat, long)
 * - getDistance(originLocation, destinationLocation, callback)
 * - showShortestWay(completeRoute)
 */
googleMap.service("googleMapsService", function($rootScope, $log, $window, $q, $timeout) {

	var map;

	var directionsService;
	var directionsDisplay;

	var newLocation;

	return {

		/*
		 * Initialize the google map, which means to load the api script and set the default values.
		 * @param mapId: id of the div container where the map should be pointed
		 * @param listId: id of the div container where the calculated route should be pointed
		 * @param searchBoxId: id of the input field for the google maps search
		 * @param lat: default value for google maps value lat
		 * @param long: default value for google maps value long
		 */
		initialize : function(mapId, listId, searchBoxId, lat, long) {

			loadGoogleMapApi().then(function() {
				directionsService = new google.maps.DirectionsService;
				directionsDisplay = new google.maps.DirectionsRenderer;
				var location = new google.maps.LatLng(lat, long);
				var mapOptions = {
					zoom : 12,
					center : location
				};
				map = new google.maps.Map(document.getElementById(mapId), mapOptions)

				setSearchBoxToMap(map, searchBoxId);
				directionsDisplay.setMap(map);
				directionsDisplay.setPanel(document.getElementById(listId));
			});
		},

		/*
		 * Get the distance between two locations and starts a callback with these distance
		 * @param originLocation: the originLocation as locationFact Object
		 * @param destinationLocation: the destinationLocation as locationFact Object
		 * @param callback: a function which returns the distance and locations
		 */
		getDistance : function(originLocation, destinationLocation, callback) {
			googleGetDistance(originLocation, destinationLocation, function(distance, orign, destination) {
				callback(distance, orign, destination);
			})
		},

		/*
		 * Displays the shortest route on the google map and lists the breakpoints
		 * @param completeRoute: an array of all locations(locations names for google maps api) in the right order
		 */
		showShortestWays : function(completeRoute) {
			$log.debug("map ", map, " route ", completeRoute);
			var originLocation = completeRoute[0].route.shift();
			var destinationLocation = completeRoute[0].route.pop();
			var wayPoints = [];
			for (var i = 0; i < completeRoute[0].route.length; i++) {
				wayPoints.push({
					location : completeRoute[0].route[i],
					stopover : true,
				});
			}
			directionsService.route({
				origin : originLocation,
				destination : destinationLocation,
				waypoints : wayPoints,
				travelMode : google.maps.TravelMode.DRIVING
			}, function(response, status) {
				if (status === google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
				} else {
					window.alert('Directions request failed due to ' + status + "and Response " + response);
				}
			});
		},

		/*
		 * Returns the new elected location
		 */
		getNewLocation : function() {
			return newLocation;
		}
	}

	/*
	 * Derived from  https://developers.google.com/maps/documentation/javascript/examples/places-searchbox?hl=de
	 * 
	 * Set the search box for the google map and starts a broadcast if a location was elected.
	 */
	function setSearchBoxToMap(map, searchBoxId) {
		// Create the search box and link it to the UI element.
		var input = document.getElementById(searchBoxId);
		var searchBox = new google.maps.places.SearchBox(input);
		// map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

		// Bias the SearchBox results towards current map's viewport.
		map.addListener('bounds_changed', function() {
			searchBox.setBounds(map.getBounds());
		});

		var markers = [];
		// Listen for the event fired when the user selects a prediction and
		// retrieve
		// more details for that place.
		searchBox.addListener('places_changed', function() {
			var places = searchBox.getPlaces();
			newLocation = places;
			$rootScope.$broadcast("newLocationElected");
			if (places.length == 0) {
				return;
			}

			// Clear out the old markers.
			markers.forEach(function(marker) {
				marker.setMap(null);
			});
			markers = [];

			// For each place, get the icon, name and location.
			var bounds = new google.maps.LatLngBounds();
			places.forEach(function(place) {
				var icon = {
					url : place.icon,
					size : new google.maps.Size(71, 71),
					origin : new google.maps.Point(0, 0),
					anchor : new google.maps.Point(17, 34),
					scaledSize : new google.maps.Size(25, 25)
				};

				// Create a marker for each place.
				markers.push(new google.maps.Marker({
					map : map,
					icon : icon,
					title : place.name,
					position : place.geometry.location
				}));

				if (place.geometry.viewport) {
					// Only geocodes have viewport.
					bounds.union(place.geometry.viewport);
				} else {
					bounds.extend(place.geometry.location);
				}
			});
			map.fitBounds(bounds);
		});
	}

	/*
	 * Derived from http://stackoverflow.com/questions/24246403/angularjs-load-google-map-script-async-in-directive-for-multiple-maps
	 */
	function loadGoogleMapApi() {
		var deferred = $q.defer();

		// Load Google map API script
		function loadScript() {
			// Use global document since Angular's $document is weak
			var script = document.createElement('script');
			script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCaGn_prtaPYfOnh3Tf7uNCHspM9__uYl4&libraries=places&callback=initMap';

			document.body.appendChild(script);
		}

		// Script loaded callback, send resolve
		$window.initMap = function() {
			deferred.resolve();
		}

		loadScript();

		return deferred.promise;
	}

	/*
	 * Get the Distance between two Locations and catch the following errors:
	 * - OVER_QUERY_LIMIT: this status was thrown if there are too many requests at once
	 * - ZERO_RESULTS: this status was thrown if a location was elected where no route can be calculated
	 */
	function googleGetDistance(originLocation, destinationLocation, callback) {
		directionsService.route({
			origin : originLocation.locationName,
			destination : destinationLocation.locationName,
			travelMode : google.maps.TravelMode.DRIVING
		}, function(response, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				var routes = response.routes;
				if (routes.length == 1) {
					var legs = routes[0].legs;
					if (legs.length == 1) {
						callback(legs[0].distance.value, originLocation, destinationLocation);
					}
				}
			} else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
				// call again if to much requests at the same time
				$timeout(googleGetDistance, 1000, true, originLocation, destinationLocation, function(distance, orign, destination) {
					callback(distance, orign, destination)
				})
			} else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
				$log.debug("status ", status, " respones ", response)
				window.alert('Es konnte leider keine Route zwischen den Vorhanden Orten berechnet werde. \n Bitte entfernen sie den letzen Ort wieder.');
			} else {
				window.alert('Directions request failed due to ' + status + "and test Response " + response);
			}
		});
	}

})
