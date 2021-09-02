/**
 * Created by highlander on 10/8/17.
 */


/**
 * Created by highlander on 9/7/17.
 */
/**
 * Created by highlander on 9/7/17.
 */
/**
 * Created by highlander on 9/4/17.
 */


let TAG = " | Time-commands | "


module.exports = {
    //
    //time tools
    timeNow: function () {
        return new Date().getTime().toString();
    },

    dateToTimestamp: function (month, date, year) {
        let input = month + " " + date + " " + year
        let output = new Date(input).getTime()
        return output.toString();
    },

    timestampToDate: function (timestamp) {
        timestamp = parseInt(timestamp)
        let output = new Date(timestamp).toString()
        return output.toString();
    },

}








