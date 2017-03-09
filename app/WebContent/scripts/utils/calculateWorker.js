/*
 * This script is the worker how calculate all possible routes
 */

self.importScripts('functions.js');
var allRoutes = [];
var locations;
var bruteForceOptimize;
var countCalculatedRoutes;
var broadcastChannel = new BroadcastChannel('worker');

/*
 * Listens when the worker should start
 * ant return allRoutes via postMessage
 */
onmessage = function(params) {

	countCalculatedRoutes = 0;
	allRoutes = [];
	locations = [];
	var originLocation = JSON.parse(params.data[0]);
	var destinationLocation = JSON.parse(params.data[1]);
	var breakpoints = JSON.parse(params.data[2]);
	locations = JSON.parse(params.data[3]);
	var way = params.data[4];
	var route = params.data[5];

	wayOfAlwaysShortesRoute(originLocation, destinationLocation, breakpoints, 0, route)
	routeing(originLocation, destinationLocation, breakpoints, 0, route)

	postMessage(allRoutes)
	close();

};

/*
 * Calculates the route(recursively) when you always take the location, with the shortest Way
 * and set the var bruteForceOptimize with the route
 * @param location: the location(locationFact object) where you gonna start
 * @param destinationLocation: the destination location(locationFact object)
 * @param breakpoints: possible next breakpoints(array of locationFact object)
 * @param way: the covered distance
 * @param route the covered locations 
 */
function wayOfAlwaysShortesRoute(location, destinationLocation, breakpoints, way, route) {

	if (breakpoints.length > 0) {
		var shortestWay = getShortestWay(location, breakpoints)
		routeToShortest(location, destinationLocation, breakpoints, way, route, shortestWay)
	} else {
		var newWay = createWayObject(location, destinationLocation, route, way);
		bruteForceOptimize = newWay;
	}
}

/*
 * Get an array of location sorted by the length of the distance
 * @param location: actual location(locationFact object)
 * @param breakpoints: possible next breakpoints(array of locationFact object)
 */
function getShortestWay(location, breakpoints) {
	var shortestWay;
	var sortable = [];
	for ( var key in location.routingMap) {
		if (location.routingMap.hasOwnProperty(key)) {

			sortable.push([key, location.routingMap[key]])
		}
	}
	var sortedWays = sortable.sort(function(a, b) {
		return a[1] - b[1]
	})

	for (var i = 0; i < sortedWays.length; i++) {
		if (containsLocation(breakpoints, sortedWays[i][0])) {
			shortestWay = sortedWays[i];
			break;
		}
	}
	return shortestWay;
}

/*
 * Route to the next location
 * and set the var bruteForceOptimize with the route
 * @param location: the location(locationFact object) where you gonna start
 * @param destinationLocation: the destination location(locationFact object)
 * @param breakpoints: possible next breakpoints(array of locationFact object)
 * @param way: the covered distance
 * @param route the covered locations 
 * @param shortesWay: an array of location sorted by the length of the distance
 */

function routeToShortest(location, destinationLocation, breakpoints, way, route, shortestWay) {
	for ( var key in location.routingMap) {
		if (location.routingMap.hasOwnProperty(key)) {
			var newWay = JSON.parse(JSON.stringify(way));
			var newRoute = JSON.parse(JSON.stringify(route));
			var newBreakpoints = JSON.parse(JSON.stringify(breakpoints));
			if (shortestWay[0] == key) {
				var nextLocation = getLocation(key, locations)
				newRoute.push(key);
				newWay = way + location.routingMap[key];
				removeLocationsEntry(newBreakpoints, nextLocation);
				wayOfAlwaysShortesRoute(nextLocation, destinationLocation, newBreakpoints, newWay, newRoute)
			}
		}
	}
}

/*
 * The routing function is recursively it test all possible routings and fill the Array allRoutes with these.(brute-force)
 * The function also inform the frontend above the current calculated Route via the broadcastChannel.
 * @param location: the location(locationFact object) where you gonna start
 * @param destinationLocation: the destination location(locationFact object)
 * @param breakpoints: possible next breakpoints(array of locationFact object)
 * @param way: the covered distance
 * @param route the covered locations 
 */
function routeing(location, destinationLocation, breakpoints, way, route) {
	if (way < bruteForceOptimize.way) {
		if (breakpoints.length > 0) {
			getNextRoute(location, destinationLocation, breakpoints, way, route);

		} else {
			routeToLastLocation(location, destinationLocation, way, route)
		}
	} else {
		stopRouting(breakpoints)
	}
}

/*
 * Routes to the next location
 * @param location: the location(locationFact object) where you gonna start
 * @param destinationLocation: the destination location(locationFact object)
 * @param breakpoints: possible next breakpoints(array of locationFact object)
 * @param way: the covered distance
 * @param route the covered locations 
 */
function getNextRoute(location, destinationLocation, breakpoints, way, route) {
	for ( var key in location.routingMap) {
		var newWay = JSON.parse(JSON.stringify(way))
		var newRoute = JSON.parse(JSON.stringify(route));
		var newBreakpoints = JSON.parse(JSON.stringify(breakpoints));
		if (containsLocation(newBreakpoints, key)) {
			var nextLocation = getLocation(key, locations)
			newRoute.push(key);
			newWay = way + location.routingMap[key];
			removeLocationsEntry(newBreakpoints, nextLocation);
			routeing(nextLocation, destinationLocation, newBreakpoints, newWay, newRoute)
		}
	}
}

/*
 * Routes to the last location
 * @param location: the location(locationFact object) where you gonna start
 * @param destinationLocation: the destination location(locationFact object)
 * @param way: the covered distance
 * @param route the covered locations 
 */
function routeToLastLocation(location, destinationLocation, way, route) {
	var newWay = createWayObject(location, destinationLocation, route, way);
	if (way < bruteForceOptimize.way) {

		bruteForceOptimize = newWay;
	}
	countCalculatedRoutes++;
	broadcastChannel.postMessage(countCalculatedRoutes)
	allRoutes.push(newWay)
}

/*
 * Stop routing cause there is almost a shorter way
 * @param breakpoints: possible next breakpoints(array of locationFact object)
 */
function stopRouting(breakpoints) {
	if (breakpoints.length == 0) {
		countCalculatedRoutes++;
	} else {
		countCalculatedRoutes = countCalculatedRoutes + faculty(breakpoints.length)
	}
	broadcastChannel.postMessage(countCalculatedRoutes)
}

/*
 * Create a new way Object
 * @param location: the location(locationFact object) where you gonna start
 * @param destinationLocation: the destination location(locationFact object)
 * @param way: the covered distance
 * @param route the covered locations  
 */
function createWayObject(location, destinationLocation, route, way) {
	var newWay = {
		route : "",
		way : 0

	}
	route.push(destinationLocation.locationName)
	way = way + location.routingMap[destinationLocation.locationName]

	newWay.route = route;
	newWay.way = way;
	return newWay;
}

/*
 * Return the desired location of a locations array
 * @param locationName: the desired location (locationFact object)
 * @param locations: a locations array (locationFact objects)
 */
function getLocation(locationName, locations) {
	for (var i = 0; i < locations.length; i++) {
		if (locations[i].locationName == locationName) {
			return locations[i];
		}
	}
}