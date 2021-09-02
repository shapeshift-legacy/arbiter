/*


        Build charts on demand


        types:

            pie balances

 */




require('dotenv').config();
//require('dotenv').config({path:"../.env"});

const TAG = " | audit-transfer-worker | "
const log = require('@arbiter/dumb-lumberjack')()
const shortid = require('shortid')
const config = require("../configs/env")

const fs = require('fs');

//chartData
const charts = require('../modules/charts')
const path = require('path');

//redis
const util = require('@arbiter/arb-redis')
//const redis = util.redis
// NOTE: we create NEW CONNECTION!
// these workers are BLOCKING! do not use on main thread!!
const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const publisher = util.publisher


// For jsdom version 10 or higher.
// Require JSDOM Class.
var JSDOM = require('jsdom').JSDOM;
// Create instance of JSDOM.
var jsdom = new JSDOM('<body><div id="container"></div></body>', {runScripts: 'dangerously'});
// Get window
var window = jsdom.window;

// require anychart and anychart export modules
var anychart = require('anychart')(window);
var anychartExport = require('anychart-nodejs')(anychart);



//mongo

//mongo
// let {reportLA,credits,debits,trades,transfers} = require('@arbiter/arb-mongo')
// let transfersDB = transfers
// let tradesDB = trades


const build_chart = async function(chartInfo){
    let tag = TAG + " | build_chart | "
    try{
        log.info(tag,"chart: ",chartInfo)
        log.info(tag,"chart: ",typeof(chartInfo))
        log.info(tag,"type: ",chartInfo.type)

        let chartData
        switch(chartInfo.type) {
            case "balance":

                //get data
                chartData = await charts.balancesPieUSD()
                log.info(tag,"chartData: ",chartData)
                // chart creating should be called only right after anychart-nodejs module requiring
                var chart = anychart.pie(chartData);

                // set the offset for the labels
                chart.innerRadius("30%");

                chart.bounds(0, 0, 1200, 900);
                chart.container('container');

                break;
            case "history":

                //get data
                chartData = await charts.balanceHistoryUSD()

                //show data
                let message = {
                    id: shortid(),
                    userId: 'BOT001',
                    channelId: 'help',
                    content:JSON.stringify(chartData),
                    dateAdded: new Date().getTime() }

                publisher.publish('publish', JSON.stringify(message))

                //create cartesian chart
                var chart = anychart.cartesian();

                //create data set on our data
                var dataSet = anychart.data.set(chartData);

                //map data for the first series,take value from first column of data set
                var seriesData = dataSet.mapAs({'x': 0, 'value': 1});

                //create jumpLine series with mapping data
                chart.jumpLine(seriesData);
                //set scale minimum
                chart.yScale().minimum(0);
                //tooltips position and interactivity settings
                chart.tooltip().positionMode('point').format("Value: {%Value}%");
                //set in
                chart.interactivity().hoverMode('by-x');
                //set yAxis labels formatter
                chart.yAxis().labels().format("{%Value}");
                //axes titles
                chart.xAxis().enabled(true);
                //set container id for the chart
                chart.container('container');

                // set container id for the chart
                chart.bounds(0, 0, 1200, 900);
                chart.container('container');

                break;
            case "balances":

                //get data
                chartData = await charts.balanceHistoryUSD()
                log.info(tag,"chartData: ",chartData)
                // create data set on our data
                var dataSet = anychart.data.set(chartData);

                // map data for the first series, take x from the zero column and value from the first column of data set
                var seriesData_1 = dataSet.mapAs({'x': 0, 'value': 1});

                // map data for the second series, take x from the zero column and value from the second column of data set
                var seriesData_2 = dataSet.mapAs({'x': 0, 'value': 2});

                // map data for the third series, take x from the zero column and value from the third column of data set
                var seriesData_3 = dataSet.mapAs({'x': 0, 'value': 3});

                // create line chart
                var chart = anychart.line();

                // turn on chart animation
                chart.animation(true);

                // turn on the crosshair
                chart.crosshair().enabled(true).yLabel().enabled(false);
                chart.crosshair().enabled(true).yStroke(null);

                // set y axis title
                chart.yAxis().title('Value (USD)');

                // create first series with mapped data
                var series_1 = chart.stepLine(seriesData_1);
                series_1.name('Value total assets (USD)').hovered().markers().enabled(true).type('circle').size(4);


                // turn the legend on
                chart.legend().enabled(true).fontSize(13).padding([0, 0, 20, 0]);


                // set container id for the chart
                chart.bounds(0, 0, 1200, 900);
                chart.container('container');

                break;
            default:
                throw Error("101: unhandled type")
        }



        let type = chartInfo.type


        let filename = type+":"+ new Date().getTime()

        anychartExport.exportTo(chart, 'jpg').then(function(image) {
            fs.writeFile(path.resolve(__dirname, './../reports/'+filename+'.jpg'), image, function(fsWriteError) {
                if (fsWriteError) {
                    console.log(fsWriteError);
                } else {
                    console.log('Complete');

                    //TODO push chart to channel
                    // push
                    let message = {
                        id: shortid(),
                        userId: 'BOT001',
                        channelId: 'help',
                        content: '<img src="http://127.0.0.1:3010/'+filename+'.jpg" alt="Italian Trulli">' +
                        '<br><a href="http://127.0.0.1:3010/'+filename+'.jpg">Download your chart!</a>',
                        dateAdded: new Date().getTime() }

                    publisher.publish('publish', JSON.stringify(message))
                    return 'Complete'
                }
            });
        }, function(generationError) {
            console.log(generationError);
        });


    }catch(e){
        log.error(e)
        throw e
    }
}


let do_work = async function () {
    let tag = TAG + ' | do_work | '
    try {
        let workLeft = await redis.llen('queue:charts')
        log.debug('orders left in queue: ', workLeft)
        let transfer = await redis.blpop('queue:charts',10)

        if (transfer){
            log.info(tag, 'transfer: ', transfer)
            transfer = JSON.parse(transfer[1])

            await build_chart(transfer)
            let workLeft = await redis.llen('queue:charts')
            log.debug('orders left in queue: ', workLeft)
            do_work()
        } else {
            do_work()
        }
    } catch (e) {
        console.error(tag, 'e: ', e)
        console.error(tag, 'Bad action: ', e)
        do_work()
    }
}


do_work()
log.info(TAG+'worker started!')
