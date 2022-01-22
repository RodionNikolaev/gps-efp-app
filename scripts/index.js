var fp = null;
var settings = null;

let fullGpsDistance = null;
let fullGpsBearing = null;

let fullSvgLength = null;
let fullSvgAngle = null;

let routeLines = null;
let prevPoint = null;

let lastBoothClick = null;

function pixelsToMeters(pixels) {
    return pixels * fullGpsDistance / fullSvgLength;
}

function config(fpSettings) {

    settings = fpSettings;

    let { p0, p1 } = fpSettings;

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
        fp.selectRoute(null, starded ? null : lastBoothClick || "Hotel");
    })
}

function updadeCurrentPosition(coords) {

    let lat = coords.latitude;
    let lon = coords.longitude;

    if (!lat || !lon || !settings) {
        prevPoint = null;
        return;
    }

    let { p0 } = settings;

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
            let part = lineLength(routeLines[perp.i].p0, perp.p);

            let currAngle = lineAngle(routeLines[perp.i].p1, routeLines[perp.i].p0);
            let nextAngle = lineAngle(routeLines[perp.i - 1].p1, routeLines[perp.i - 1].p0);

            let distToTurn = round(pixelsToMeters(part), 0);
            let direction = getDirection(routeLines[perp.i].p1, routeLines[perp.i].p0, routeLines[perp.i - 1].p0);

            if (distToTurn <= 100) {
                document.querySelector(".turns").classList.add("visible");
                document.querySelector(".turns").innerHTML = direction > 0 ? ` ${distToTurn}m 🡆` : ` 🡄 ${distToTurn}m `;
            }
            else
                document.querySelector(".turns").classList.remove("visible");

            leftPixels += part;
        }
    }

    let leftMeters = pixelsToMeters(leftPixels);
    let leftKm = leftMeters ? (round(leftMeters / 1000, 2) + " km") : "--";

    if (leftMeters > 0 && leftMeters <= 15) {
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
