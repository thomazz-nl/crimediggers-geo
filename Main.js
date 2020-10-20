// Import modules
let Fs          = require('fs');
let Path        = require('path');

// Import classes
let Geolib      = require('geolib');
let Helpers     = require('./lib/Helpers.js');

// Import variables
let config      = require('./config/config.json');

console.log('Usage: node main \"./data/GPS 1.gpx\" \"./data/GPS 2.gpx\"\r\n');

if(process.argv.length > 4)
{
    console.error('Too many parameters, please supply paths to two .gpx files to intersect GPS locations.');
}

else
{
    if (process.argv.length == 2)
    {
        console.error('Missing parameters, please supply paths to two .gpx files to intersect GPS locations.');
        console.log('Assuming arguments: \"./data/GPS 1.gpx\" \"./data/GPS 2.gpx\"\r\n');
        process.argv[2] = './data/GPS 1.gpx';
        process.argv[3] = './data/GPS 2.gpx';
    }
    
    else if (process.argv.length == 3)
    {
        console.error('Missing parameter, please supply paths to two .gpx files to intersect GPS locations.');
        console.log('Assuming arguments: \"' + process.argv[2] + '\" \"./data/GPS 2.gpx\"\r\n');
        process.argv[3] = './data/GPS 2.gpx';
    }
    
    if(Fs.existsSync(process.argv[2]) && Path.extname(process.argv[2]) == '.gpx' && Fs.existsSync(process.argv[3]) && Path.extname(process.argv[3]) == '.gpx' )
    {
        let gpxFilepath1    = process.argv[2];
        let gpxFilepath2    = process.argv[3];
        
        let gpxPromises     = new Array();
        gpxPromises.push(Helpers.loadGpxPromise(gpxFilepath1));
        gpxPromises.push(Helpers.loadGpxPromise(gpxFilepath2));
        
        Promise.all(gpxPromises)
            .then((gpxPromiseResults) => {
                if (gpxPromiseResults.length == 2)
                {
                    gpxPromiseResults.forEach((gpxPromiseResult) => {
                        gpxPromiseResult.geoObjects = Helpers.createGeoLibObjects(gpxPromiseResult.gpxContent);
                        
                        console.log('File ' + gpxPromiseResult.filepath + ' has ' + gpxPromiseResult.geoObjects.length + ' known coordinates.');
                    });
                    
                    console.log('');

                    for (let i=0; i < gpxPromiseResults[0].geoObjects.length; i++)
                    {
                        let geoObject0 = gpxPromiseResults[0].geoObjects[i];
                        
                        for (let j=0; j < gpxPromiseResults[1].geoObjects.length; j++)
                        {
                            let geoObject1  = gpxPromiseResults[1].geoObjects[j]; 
                            let distance    = Geolib.getDistance(geoObject0, geoObject1);
                            
                            if (distance < config.maxDistanceInMeter)
                            {
                                let timeframe    = config.maxTimeframeInMinutes * 60 * 1000;
                                let intervalGeo0 = gpxPromiseResults[0].geoObjects[i+1].time - geoObject0.time;
                                let intervalGeo1 = gpxPromiseResults[1].geoObjects[j+1].time - geoObject1.time;
                                
                                if (intervalGeo0 > config.warnGpsBlackoutInMinutes * 60 * 1000)
                                {
                                    timeframe = intervalGeo0;
                                }
                                
                                if (intervalGeo1 > config.warnGpsBlackoutInMinutes * 60 * 1000)
                                {
                                    timeframe = intervalGeo1;
                                }
                                
                                if (Math.abs(geoObject0.time - geoObject1.time) < timeframe)
                                {
                                    console.log('Match distance: ' + distance + 'm');
                                    timeframe == intervalGeo0 && console.log('Warning: GPS blackout detected of about ' + Math.floor(intervalGeo0 / (60 * 1000)) + 'minutes on ' + gpxPromiseResults[0].filepath + '. Allowing match within that timeframe.');
                                    timeframe == intervalGeo1 && console.log('Warning: GPS blackout detected of about ' + Math.floor(intervalGeo1 / (60 * 1000)) + 'minutes on ' + gpxPromiseResults[1].filepath + '. Allowing match within that timeframe.');
                                    console.log(gpxPromiseResults[0].filepath + ' ' + geoObject0.latitude + ';' + geoObject0.longitude + ' ' + geoObject0.time.toLocaleString());
                                    console.log(gpxPromiseResults[1].filepath + ' ' + geoObject1.latitude + ';' + geoObject1.longitude + ' ' + geoObject1.time.toLocaleString());
                                    console.log('');
                                }
                            }
                        }
                    }
                }
                
                else
                {
                    throw new Error('Parsing .gpx files did not return exactly two results.');
                }
                
                console.log("Process completed\r\n");
            })
            .catch((error) => { console.error(error); });
    }
    
    else
    {
        console.error('Invalid parameters, please supply paths to two .gpx files to intersect GPS locations.');
    }
}
