/*
 * ##########################################################################
 * #																		#
 * #		Functions which where needed by more then one script			#											
 * #																		#
 * ##########################################################################
 */

/*
 * Proof if the given locations array contains the locationName
 * @param locations: locations (locationFact objects) array to proof
 * @param locationName: the locationName (locationFact object attribut) to search
 * 
 * @return: returns true if the locations locations contains the locationName, otherwise return false
 */
function containsLocation(locations, locationName) {
	var locationIsContained = false;

	for ( var key in locations) {
		if (locations.hasOwnProperty(key)) {
			if (locations[key].locationName == locationName) {
				locationIsContained = true;
			}
		}
	}
	return locationIsContained;
}

/*
 * Remove an locationFact object from an locationFact object locations @param
 * locationsArray: the locations array to proof @param location: the location to
 * remove
 * 
 * @return: return the cleand locations locations
 */
function removeLocationsEntry(locationsArray, location) {
	var object = searchObject(locationsArray, location)
	var locationIndex = locationsArray.indexOf(object);
	locationsArray.splice(locationIndex, 1);
	return locationsArray;
}

/*
 * Get the index of the location in the locations array @param locationsArray:
 * location array with locationFact objects @param locaton: location obejct to
 * search
 * 
 * @return: returns index of searched location
 */
function searchObject(locationsArray, location) {
	for (var index = 0; index < locationsArray.length; index++) {
		if (locationsArray[index].locationName === location.locationName) {
			return locationsArray[index];
		}
	}
}

/*
 * Get the faculty of a number
 * @param number: the number where you want the faculty
 * 
 * @return: the faculty of the number
 */
function faculty(number) {
	var result = 1;
	for (var i = 1; i <= number; i++) {
		result = result * i;
	}
	return result;
}