var fp = null;
var fpConfig = null;

let fullGpsDistance = null;
let globalGpsBearing = null;

let fullSvgLength = null;
let fullSvgAngle = null;

let routeLines = null;
let prevPoint = null;

let lastBoothClick = null;

let routeFrom = null;

function pixelsToMeters(pixels) {
    return pixels * fullGpsDistance / fullSvgLength;
}

function config(conf, eventId) {

    fpConfig = conf;

    let { p0, p1 } = conf;

    fullGpsDistance = distance(p0.lat, p0.lon, p1.lat, p1.lon);
    globalGpsBearing = bearing(p0.lat, p0.lon, p1.lat, p1.lon);

    fullSvgLength = lineLength(p0, p1);
    fullSvgAngle = lineAngle(p0, p1);

    let _fp = new ExpoFP.FloorPlan({
        element: document.querySelector("#floorplan"),
        eventId,
        noOverlay: false,
        onBoothClick: (e) => lastBoothClick = e.target.name,
        onFpConfigured: () => {
            fp = _fp;
        },
        onDirection: (e) => {
            routeLines = e.lines;
        }
    });
}

/**
 * @param  {Object} Current location point coordinations
 */
function updadeCurrentPosition(coords) {

    coords = fpConfig.testP || coords;

    let currLat = coords.latitude;
    let currLon = coords.longitude;

    if (!currLat || !currLon || !fpConfig) {
        prevPoint = null;
        return;
    }

    let { p0 } = fpConfig;

    // Distance between top left point of plan and current point
    let pointDistance = distance(p0.lat, p0.lon, currLat, currLon);

    // Angle between North and top left point of plan and current point 
    let pointBearing = bearing(p0.lat, p0.lon, currLat, currLon);

    let deltaDegrees = pointBearing - globalGpsBearing;
    let deltaDistanсe = pointDistance / fullGpsDistance;

    // Current point position in SVG coordinates.
    let locationPixel = rotatePoint(deltaDegrees, shiftPoint(p0, fullSvgLength * deltaDistanсe, fullSvgAngle), p0.x, p0.y);

    if (fp) fp.selectCurrentPosition(locationPixel, !prevPoint);

    let leftPixels = 0;

    if (routeLines) {
        let perp = shortestrPerp(locationPixel, routeLines);

        for (let i = 0; i < routeLines.length; i++) {
            let line = routeLines[i];
            let len = lineLength(line.p0, line.p1);
            if (!perp || perp.i > i) leftPixels += len;
        }

        if (perp) {

            let currentLine = routeLines[perp.i];
            let nextLine = routeLines[perp.i - 1];

            // let currAngle = lineAngle(currentLine.p1, currentLine.p0);
            // let nextAngle = lineAngle(nextLine.p1, nextLine.p0);

            let distToTurnPixels = lineLength(currentLine.p0, perp.p);
            leftPixels += distToTurnPixels;

            if (nextLine) {
                let distToTurnMeters = round(pixelsToMeters(distToTurnPixels), 0);
                let turnDirection = getDirection(routeLines[perp.i].p1, routeLines[perp.i].p0, nextLine.p0); // Clockwise, Counterclockwise                
            }
        }
    }

    let leftMeters = pixelsToMeters(leftPixels);
    let leftKm = leftMeters ? (round(leftMeters / 1000, 2) + " km") : "--";

    if (leftMeters > 0 && leftMeters <= 20) {
        fp.selectRoute(null, null);
        alert("Route completed");
        return;
    }

    let speedMeters = coords.speed > 0.5 ? coords.speed : 0;
    let speedKm = speedMeters ? (round(speedMeters * 3.6, 1) + " km/h") : "--";

    let leftTime = leftPixels && speedMeters ? new Date(leftMeters / speedMeters * 1000).toISOString().substr(11, 8).replace(/^00:/, "") : "--";

    prevPoint = locationPixel;
}
