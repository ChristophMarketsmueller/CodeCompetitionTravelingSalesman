var locationService = angular.module("locationFactory", []);

/*
 * The locationFact represents an location object and a static methods.
 * Location Object:
 * - locationFact(googleMapsLocation, locationName) as constructor
 * Location static method:
 * - deleteRouteMapEntry(entry, locations)
 */
locationService.factory("locationFact", function($log) {
	
	/*
	 * Constructor for location Object which contains:
	 * - the orign google maps object
	 * - the location name
	 * - the routing map of the location
	 * 
	 * @param googleMapsLocation: orgin google maps object
	 * @param locationName: location name as string
	 */
	var locationFact = function(googleMapsLocation, locationName) {
		this.googleMapsLocation = googleMapsLocation
		this.locationName = locationName;
		this.routingMap ={};
	}
	
	/*
	 * deletes from the given location the entry that should be remove
	 * @param entry: entry(locationName) to remove from the routing map
	 * @param locations: locations(locatonFact Objects) to iterrate
	 */
	locationFact.deleteRouteMapEntry = function(entry, locations) {
		for (var i = 0; i < locations.length; i++) {
			delete locations[i].routingMap[entry]
		}
	}
		return locationFact;
});