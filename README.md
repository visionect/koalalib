trackmanipulation [![Build Status](https://travis-ci.org/visionect/koalalib.png?branch=master)](https://travis-ci.org/visionect/koalalib) [![Coverage Status](https://coveralls.io/repos/visionect/koalalib/badge.png)](https://coveralls.io/r/visionect/koalalib)
=========================================================================================================================================

Trackmanipulation is a jQuery plugin and improvement to Visionect Server JavaScript extensions. It is intended to ease the development of applications for Visionect E Paper tablets (V-Tablets). Find out more at: http://www.visionect.si/

Usage
-----
Include jQuery and jquery.trackmanipulation.js at the bottom of your HTML file, right before the end of `body` tag. And then you can use `okular.add(options)` and `$.fn.tmList(options)` in your code.

```html
<script src="lib/jquery-2.0.3.js"></script>
<script src="jquery.trackmanipulation-3.10.js"></script>
```


`okular.init(options)`
----------------------
Call this function on page load with options object to override the default settings. If you don't call it, default settings will be used.

Default settings: 

```javascript
okular.defaults = {
    width: 600, //width of device for debug display
    height: 800, //height of device for debug display
    debug: true, //enable debug display and console output
    debugOffset: 10, //offset of debug display from main display (in px)
    position: 'right', //position of debug display ('right' or 'bottom')
    newRectangleFormat: false, //use koalas new rectangle format (currently not supported by device firmware)
    combineRectangles: true, //enable rectangle combining
    bitDepth: 4, //default bit depth
    dithering: okular.dithering.default, //default dithering
    renderDelay: 0, //default time for between each rectangle commit and actual rendering to device
    timeoutFirst: 10, //wait time for empty queue
    timeoutA2: 205, //wait time for device to display A2 rectangles
    timeout1bit: 250, //wait time for device to display 1 bit rectangles
    timeout4bit: 750, //wait time for device to display 4 bit rectangles
    timeoutClick: 50 //wait time before sending NoChange to device on body click if there are no rectangles in queue
}
```

You can override any of the above options, but it is strongly recommended that you don't change timeout values unless you know exactly what you are doing.

Example init call for horizontal debug display:

```javascript
okular.init({
    width: 800,
    height: 600
});
```

`okular.add(options)`
---------------------
Adds a new rectangle to queue. The only two required arguments are width and height, others will be used from `okular.defaultRectangleOptions` or can be overridden.

Default rectangle options:

```javascript
okular.defaultRectangleOptions = {
    combine: okular.defaults.combineRectangles, //combine rectangle with others
    bitDepth: okular.defaults.bitDepth, //rectangle bit depth
    A2: false, //use A2 waveform to render
    inverse: false, //inverse render
    dithering: okular.defaults.dithering, //rectangle dithering
    renderDelay: okular.defaults.renderDelay, //time between rectangle commit and actual rendering to device
    top: 0, //rectangle offset from top
    left: 0 //rectangle offset from left
};
```

`$.fn.tmList(options)`
----------------------
This is a jQuery function that expects the same options as `okular.add`, but it will calculate offset and size of required rectangle from the jQuery object.

Example:

```javascript
$('body').tmList(); //this will do a full page 4 bit render
$('div.navigation').tmList({   //this will do a 1 bit render of all 
    bitDepth: 1                //visible divs with class 'navigation'
});
```

Caution
-------

When you use rectange combining or old rectangle format there will be some things you need to look for:
* Rectangles will use the highest bit depth in queue
* Rectangles will use use the highest dithering in queue (highest from list [default, none, Bayer, FloydSteinberg])
* If at least one rectangle in queue is using A2 rendering all others will use it too
* If at least one rectangle in queue is using inverse rendering all others will use it too
