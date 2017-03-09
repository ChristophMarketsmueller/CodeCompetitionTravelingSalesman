var calculationService = angular.module('calculationService', []);

/*
 * The calculationService provide the following functions: -
 * setOriginLocation(value) - setDestinationLocation(value) -
 * calculateAllRoutes(callback)
 */
calculationService.service('calculationService', function($rootScope, $log) {

	var originLocation;

	var destinationLocation;

	return {

		/*
		 * Set the orign location @param value: orign location
		 */
		setOriginLocation : function(value) {
			originLocation = value;
		},

		/*
		 * Set the destination location @param value: destination location
		 */
		setDestinationLocation : function(value) {
			destinationLocation = value;
		},

		/*
		 * Calculate all possible routes and starts a callback with the shortest
		 * route. 
		 * @param callback: A function which returns the shortest route
		 */
		calculateAllRoutes : function(callback) {
			if (typeof (Worker) !== "undefined") {
				if (typeof (worker) == "undefined") {
					var worker = new Worker("scripts/utils/calculateWorker.js");
				}
				var allWays = [];
				var breakpoints = angular.copy($rootScope.locations);
				var route = [originLocation.locationName]

				if (originLocation != destinationLocation) {
					removeLocationsEntry(breakpoints, originLocation);
					removeLocationsEntry(breakpoints, destinationLocation);
				} else {
					removeLocationsEntry(breakpoints, originLocation);
				}

				$log.debug("start Location ", originLocation)
				$log.debug("end Location ", destinationLocation)
				$log.debug("calc, breakpoints ", breakpoints);

				var originJson = JSON.stringify(originLocation)
				var destinationJson = JSON.stringify(destinationLocation);
				var breakpointsJson = JSON.stringify(breakpoints);
				var locationsJson = JSON.stringify($rootScope.locations)
				worker.postMessage([originJson, destinationJson, breakpointsJson, locationsJson, 0, route]);

				worker.onmessage = function(event) {
					allWays = event.data;
					var shortestWay = getShortesWay(allWays)
					callback(shortestWay);

				};
			} else {
				document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Workers...";
			}
		},
	}

	/*
	 * Returns the shortes Way from all calculatet routes @param allWays: all
	 * calculated routes
	 */
	function getShortesWay(allWays) {
		var shortWays = []
		var sortedWays = allWays.sort(function(a, b) {
			return a.way - b.way
		})
		shortWays.push(sortedWays[0])
		for (var i = 1; i < sortedWays.length; i++) {
			if (shortWays[0].way == sortedWays[i].way) {
				shortWays.push(sortedWays[i])
			} else {
				break;
			}
		}
		return shortWays;
	}
})