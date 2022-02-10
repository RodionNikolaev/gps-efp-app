let watcher = null;
/**
 * Convert DMS strinf to decimal value
 * @param  {string} lat
 * @param  {string} latRef
 * @param  {string} lon
 * @param  {string} lonRef
 * @returns {object} Object with a decimal coordinates
 */
function dms2dec(lat, latRef, lon, lonRef) {
    var ref = { 'N': 1, 'E': 1, 'S': -1, 'W': -1 };
    var sep = [' ,', ' ', ','];
    var i;

    if (typeof lat === 'string') {
        for (i = 0; i < sep.length; i++) {
            if (lat.split(sep[i]).length === 3) {
                lat = lat.split(sep[i]);
                break;
            }
        }
    }

    if (typeof lon === 'string') {
        for (i = 0; i < sep.length; i++) {
            if (lon.split(sep[i]).length === 3) {
                lon = lon.split(sep[i]);
                break;
            }
        }
    }

    for (i = 0; i < lat.length; i++) {
        if (typeof lat[i] === 'string') {
            lat[i] = lat[i].split('/');
            lat[i] = parseInt(lat[i][0], 10) / parseInt(lat[i][1], 10);
        }
    }

    for (i = 0; i < lon.length; i++) {
        if (typeof lon[i] === 'string') {
            lon[i] = lon[i].split('/');
            lon[i] = parseInt(lon[i][0], 10) / parseInt(lon[i][1], 10);
        }
    }

    lat = (lat[0] + (lat[1] / 60) + (lat[2] / 3600)) * ref[latRef];
    lon = (lon[0] + (lon[1] / 60) + (lon[2] / 3600)) * ref[lonRef];

    return { lat, lon };
}

/**
 * Convert decimal value to DMS string
 * @param  {number} Decimal coordinate value
 * @param  {boolean} Is latitude  value
 * @returns {string} String in DMS format
 */
function deg2dms(value, isLat) {
    let dplaces = 2;
    let d = Math.floor(value);          // make degrees
    let m = Math.floor((value - d) * 60);    // make minutes
    let s = Math.round(((value - d) * 60 - m) * 60 * Math.pow(10, dplaces)) / Math.pow(10, dplaces); // Make sec rounded
    s == 60 && (m++, s = 0);            // if seconds rounds to 60 then increment minutes, reset seconds
    m == 60 && (d++, m = 0);            // if minutes rounds to 60 then increment degress, reset minutes

    let letter = isLat ? (value > 0 ? "N" : "S") : (value > 0 ? "E" : "W");
    return (d + "° " + m + "' " + s + '" ' + letter);   // create output DMS string
}

/**
 * Calculate the distance between two points
 * @param  {number} First point latitude
 * @param  {number} First point longitude
 * @param  {number} Second point latitude
 * @param  {number} Second point latitude
 * @returns {number} Return distance in meters
 */
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres

    return d;
}

/**
 * Calculate the dearing anel between two points
 * @param  {number} lat1
 * @param  {number} lon1
 * @param  {number} lat2
 * @param  {number} lon2
 */
function bearing(lat1, lon1, lat2, lon2) {

    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    const brng = (θ * 180 / Math.PI + 360) % 360; // in degrees
    return brng;
}

function startGps() {
    watcher = navigator.geolocation.watchPosition((pos) => {
        try {
            updadeCurrentPosition(pos.coords);
        }
        catch (e) {
            console.error(e);
        }
    }, (err) => {
       //console.error(err);
        if (watcher) {
            navigator.geolocation.clearWatch(watcher);
            watcher = null;
        }
        setTimeout(() => startGps(), 5000);
    }, {
        maximumAge: 0,
        enableHighAccuracy: true,
        timeout: 10000
    })
}