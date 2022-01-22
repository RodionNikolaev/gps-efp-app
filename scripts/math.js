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