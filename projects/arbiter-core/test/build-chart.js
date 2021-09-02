var fs = require('fs');

// For jsdom version 10 or higher.
// Require JSDOM Class.
var JSDOM = require('jsdom').JSDOM;
// Create instance of JSDOM.
var jsdom = new JSDOM('<body><div id="container"></div></body>', {runScripts: 'dangerously'});
// Get window
var window = jsdom.window;

// For jsdom version 9 or lower
// var jsdom = require('jsdom').jsdom;
// var document = jsdom('<body><div id="container"></div></body>');
// var window = document.defaultView;

// require anychart and anychart export modules
var anychart = require('anychart')(window);
var anychartExport = require('anychart-nodejs')(anychart);


console.log(anychart)
var data = [
    ['Q3 2014', 1.8],
    ['Q4 2014', 2.1],
    ['Q1 2015', 2.5],
    ['Q2 2015', 2.5],
    ['Q3 2015', 2.5],
    ['Q4 2015', 2.5],
    ['Q1 2016', 3.0],
    ['Q2 2016', 3.0]
]

//create cartesian chart
var chart = anychart.cartesian();

//create data set on our data
var dataSet = anychart.data.set(data);

//map data for the first series,take value from first column of data set
var seriesData = dataSet.mapAs({'x': 0, 'value': 1});

//create jumpLine series with mapping data
chart.jumpLine(seriesData);
//set scale minimum
chart.bounds(0, 0, 800, 600);
//tooltips position and interactivity settings
chart.tooltip().positionMode('point').format("Value: {%Value}%");
//set in
chart.interactivity().hoverMode('by-x');
//set yAxis labels formatter
chart.yAxis().labels().format("{%Value}%");
//axes titles
chart.xAxis().enabled(true);
//set container id for the chart
chart.container('container');
//initiate chart drawing
chart.draw();

// create and a chart to the jsdom window.
// chart creating should be called only right after anychart-nodejs module requiring
// var chart = anychart.pie([10, 20, 7, 18, 30]);
// chart.bounds(0, 0, 800, 600);
// chart.container('container');
// chart.draw();

// generate JPG image and save it to a file
anychartExport.exportTo(chart, 'jpg').then(function(image) {
    fs.writeFile('../reports/balances.jpg', image, function(fsWriteError) {
        if (fsWriteError) {
            console.log(fsWriteError);
        } else {
            console.log('Complete');
        }
    });
}, function(generationError) {
    console.log(generationError);
});