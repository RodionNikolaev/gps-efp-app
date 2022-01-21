function rotatePoint(angle, point, cX, cY) {
    let radians = angle / (180 / Math.PI);
    return {
        x: (point.x - cX) * Math.cos(radians) - (point.y - cY) * Math.sin(radians) + cX,
        y: (point.x - cX) * Math.sin(radians) + (point.y - cY) * Math.cos(radians) + cY
    }
}

function shiftPoint(point, length, angle) {
    return {
        x: point.x + length * Math.sin(((90 - angle) * Math.PI) / 180.0),
        y: point.y + length * Math.sin((angle * Math.PI) / 180.0),
    };
}

function lineLength(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getDirection(centerPoint, startPoint, endPoint) {
    return (startPoint.x - centerPoint.x) * (endPoint.y - centerPoint.y) - (startPoint.y - centerPoint.y) * (endPoint.x - centerPoint.x) < 0 ? -1 : 1;
}

function lineAngle(startPoint, endPoint) {
    let p1 = { x: startPoint.x + 100000, y: startPoint.y };

    let a = lineLength(p1, startPoint);
    let b = lineLength(endPoint, startPoint);
    let c = lineLength(p1, endPoint);
    let cos = (Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b);

    let direction = getDirection(startPoint, p1, endPoint);

    return direction * (Math.acos(cos > 1 ? 1 : cos) * 180) / Math.PI;
}

function perpendicularToLine(point, start, end) {
    const k =
        ((end.y - start.y) * (point.x - start.x) - (end.x - start.x) * (point.y - start.y)) /
        (Math.pow(end.y - start.y, 2) + Math.pow(end.x - start.x, 2));

    let p = {
        x: point.x - k * (end.y - start.y),
        y: point.y + k * (end.x - start.x)
    };

    return {
        p,
        isInside:
            p.x >= Math.min(start.x, end.x) &&
            p.x <= Math.max(start.x, end.x) &&
            p.y >= Math.min(start.y, end.y) &&
            p.y <= Math.max(start.y, end.y),
    };
};

function shortestrPerp(point, lines) {
    return lines.map((line, index) => {

        let perp = perpendicularToLine(point, line.p0, line.p1);
        if (!perp.isInside) return null;

        return {
            i: index,
            p: perp.p,
            l: lineLength(point, perp.p),
        };
    }).filter(p => p).sort((p1, p2) => p1.l - p2.l)[0];
}

function round(number, digits = 3) {
    return Math.round(number * Math.pow(10, digits)) / Math.pow(10, digits);
}

function formatSeconds(seconds) {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
}

var fp = null;
var settings = null;

let full_gps_distance = null;
let full_gps_bearing = null;

let full_svg_length = null;
let full_svg_Angle = null;

let routeLines = null;
let prev_point = null;

function config(fpSettings) {

    settings = fpSettings;

    let { p0, p1 } = fpSettings;

    full_gps_distance = distance(p0.lat, p0.lon, p1.lat, p1.lon);
    full_gps_bearing = bearing(p0.lat, p0.lon, p1.lat, p1.lon);

    full_svg_length = lineLength(p0, p1);
    full_svg_Angle = lineAngle(p0, p1);

    let _fp = new ExpoFP.FloorPlan({
        element: document.querySelector("#floorplan"),
        eventId: "park-pobedy",
        noOverlay: false,
        onFpConfigured: () => {
            document.querySelector(".info").classList.add("ready");
            fp = _fp;
        },
        onDirection: (e) => {
            routeLines = e.lines;
        }
    });
}

function updadeCurrentPosition(coords) {

    let lat = coords.latitude;
    let lon = coords.longitude;

    if (!lat || !lon) {
        prev_point = null;
        return;
    }

    let { p0 } = settings;

    let point_distance = distance(p0.lat, p0.lon, lat, lon);
    let point_bearing = bearing(p0.lat, p0.lon, lat, lon);

    let delta_bearing = point_bearing - full_gps_bearing; // В градусах
    let delta_distanсe = point_distance / full_gps_distance; // Соотношение от деления

    let location = rotatePoint(delta_bearing, shiftPoint(p0, full_svg_length * delta_distanсe, full_svg_Angle), p0.x, p0.y);

    if (fp) fp.selectCurrentPosition(location, !prev_point);

    let left_pixels = 0;

    if (routeLines) {

        let perp = shortestrPerp(location, routeLines);

        for (let i = 0; i < routeLines.length; i++) {
            let line = routeLines[i];
            let len = lineLength(line.p0, line.p1);

            if (!perp || perp.i > i) left_pixels += len;
        }

        if (perp) left_pixels += lineLength(routeLines[perp.i].p0, perp.p);
    }

    let left_meters = left_pixels * full_gps_distance / full_svg_length;
    let left_km = left_meters ? (round(left_meters / 1000, 2) + " km") : "--";

    let speed_meters = coords.speed;
    let speed_km = speed_meters ? (round(speed_meters * 3.6, 1) + " km/h") : "--";

    let left_time = left_pixels && speed_meters ? formatSeconds(left_meters / speed_meters) : "--";

    document.querySelector(".first").innerHTML = `${deg2dms(lat, true)}<br/>${deg2dms(lon)}`;
    document.querySelector(".second").innerHTML = `${speed_km}<br/>${left_time} / ${left_km}`;
    prev_point = location;
}
