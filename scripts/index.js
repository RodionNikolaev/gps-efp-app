var fp = null;
var fpConfig = null;

let fullGpsDistance = null;
let fullGpsBearing = null;

let fullSvgLength = null;
let fullSvgAngle = null;

let routeLines = null;
let prevPoint = null;

let lastBoothClick = null;

let routeFrom = null;

function pixelsToMeters(pixels) {
    return pixels * fullGpsDistance / fullSvgLength;
}

function config(conf) {
    
    fpConfig = conf;

    let { p0, p1 } = conf;

    fullGpsDistance = distance(p0.lat, p0.lon, p1.lat, p1.lon);
    fullGpsBearing = bearing(p0.lat, p0.lon, p1.lat, p1.lon);

    fullSvgLength = lineLength(p0, p1);
    fullSvgAngle = lineAngle(p0, p1);

    let _fp = new ExpoFP.FloorPlan({
        element: document.querySelector("#floorplan"),
        eventId: "park-pobedy",
        noOverlay: true,
        onBoothClick: (e) => lastBoothClick = e.target.name,
        onFpConfigured: () => {
            document.querySelector(".info").classList.add("ready");
            fp = _fp;
        },
        onDirection: (e) => {
            routeLines = e.lines;
            let starded = routeLines?.length;

            if (starded) {
                button.classList.add("started");
            }
            else {
                document.querySelector(".turns").classList.remove("visible");
                button.classList.remove("started");
            }

            button.innerHTML = starded ? "Stop" : "Start";
        }
    });

    let button = document.querySelector(".button");

    button.addEventListener("click", () => {
        if (!prevPoint) return;
        let starded = button.classList.contains("started");
        fp.selectRoute(routeFrom, starded ? null : lastBoothClick || "Hotel");
    })
}

function updadeCurrentPosition(coords) {

    // coords = {
    //     latitude: 59.864737,
    //     longitude: 30.315962,
    //     speed: 2
    // };

    let lat = coords.latitude;
    let lon = coords.longitude;

    if (!lat || !lon || !fpConfig) {
        prevPoint = null;
        return;
    }

    let { p0 } = fpConfig;

    let pointDistance = distance(p0.lat, p0.lon, lat, lon);
    let pointBearing = bearing(p0.lat, p0.lon, lat, lon);

    let deltaDegrees = pointBearing - fullGpsBearing;
    let deltaDistanсe = pointDistance / fullGpsDistance;

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

                document.querySelector(".turns").classList.add("visible");
                document.querySelector(".turns").innerHTML = turnDirection > 0 ? ` ${distToTurnMeters}m 🡆` : ` 🡄 ${distToTurnMeters}m `;
            } else document.querySelector(".turns").classList.remove("visible");
        }
    }

    let leftMeters = pixelsToMeters(leftPixels);
    let leftKm = leftMeters ? (round(leftMeters / 1000, 2) + " km") : "--";

    if (leftMeters > 0 && leftMeters <= 20) {
        alert("Route completed");
        fp.selectRoute(null, null);
        return;
    }

    let speedMeters = coords.speed > 0.5 ? coords.speed : 0;
    let speedKm = speedMeters ? (round(speedMeters * 3.6, 1) + " km/h") : "--";

    let leftTime = leftPixels && speedMeters ? new Date(leftMeters / speedMeters * 1000).toISOString().substr(11, 8).replace(/^00:/, "") : "--";

    document.querySelector(".first").innerHTML = `${deg2dms(lat, true)}<br/>${deg2dms(lon)}`;
    document.querySelector(".second").innerHTML = `${speedKm}<br/>${leftTime} / ${leftKm}`;
    prevPoint = locationPixel;
}
