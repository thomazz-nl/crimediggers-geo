// Import classes
let GpxParser = require("gpx-parse");

module.exports = {
    createGeoLibObjects: function(gpxParserData)
    {
        var geoLibObjects = new Array();

        gpxParserData.waypoints && gpxParserData.waypoints.forEach((waypoint) => {
            geoLibObjects.push({
                "latitude": waypoint.lat,
                "longitude": waypoint.lon,
                "time": waypoint.time
            });
        });

        return geoLibObjects;
    },
    loadGpxPromise: function(gpxFilepath)
    {
        return new Promise((resolve, reject) => {
            GpxParser.parseGpxFromFile(gpxFilepath, function(error, gpxParserData) {
                if (error)
                {
                    reject('Error parsing \'' + gpxFilepath + '\'');
                }
                
                else
                {
                    resolve({
                        "filepath": gpxFilepath,
                        "gpxContent": gpxParserData
                    });
                }
            });
        });
    }
};
