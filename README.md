# How to integrate GPS with ExpoFP plans
ExpoFP API does not have a built-in GPS functionality. 
But, you can create this functionality over ***selectCurrentPosition()*** method.

## How to define config object.

![Config](https://user-images.githubusercontent.com/10497662/150785599-5b7a06cf-03cd-4247-bdda-62b871748976.png)

To make GPS work, the system needs two points (p0 and p1) to be set manually inside the Designer coordinates {x and y}, and two points with real GPS coordinates - {lat, lon} - to be set manually to correspond with p0 and p1. The point p0 must be located in the upper left corner, the point p1 in the lower right corner (it is better to place the points as far from each other as possible, but not obligatory at the plan corners).

```js
  const fpConf = {
        p0: {
          lat: 55.99320784354992, 
          lon: 13.109172027159351,
          x: 5290,
          y: 5001
        },
        p1: {
          lat: 55.98538971157886,
          lon: 13.120635601631307,
          x: 17111,
          y: 9842
        },
        testP: {  // Test point. You can set it to replace the real GPS for tests.
          latitude: 55.99011474168899, 
          longitude: 13.112398875339332
        }
      };
 ```
## Map loading
You can check any .html file in this repo to explore a full structure.

### Step 1.
Create container div element and set the name of your expo
```html
<div data-event-id="fhday2022" id="floorplan"></div>
```
### Step 2.
Load ExpoFP API scriprt.
```js
<script src="https://wayfinding.expofp.com/packages/master/expofp.js"></script>
```
### Step 3.
Init JS
```js
startGps(); // Start GPS watching from gps.js file
config(fpConf); // Create ExpoFP object from index.js file
```
