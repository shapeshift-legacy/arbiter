<template>
  <div class="data-visualisation-tab dashboard-tab">

      <div class="col-md-12 display-flex" >
        <div class="chart-container">
          <vuestic-chart v-bind:data="donutChartData" type="donut"></vuestic-chart>
        </div>
      </div>

  </div>
</template>

<script>
  import Vue from 'vue'
  import BadgeColumn from 'components/tables/BadgeColumn.vue'
  import TableData from '../setup-profile-tab/TableData'
  import DonutChartData from './DonutChartData'
  import FieldsDef from '../setup-profile-tab/fields-definition'

  Vue.component('badge-column', BadgeColumn)

  export default {
    name: 'data-visualisation-tab',
    mounted(){
      this.DonutChartData = {
        labels: ['BTC', 'BCH', 'BITCH'],
        datasets: [{
          label: 'value (USD)',
          backgroundColor: ["#f2a900", "#ee8c28", "#04b5e5"],
          data: [30, 30, 90]
        }]
      };
      this.getBalances();
    },
    data () {
      return {
        donutChartData: {
          labels: ['BTC', 'BCH', 'LTC'],
          datasets: [{
            label: 'value (USD)',
            backgroundColor: ["#f2a900", "#ee8c28", "#04b5e5"],
            data: [30, 30, 90]
          }]
        },
        apiMode: false,
        sortFunctions: FieldsDef.sortFunctions,
        tableData: TableData,
        onEachSide: 1,
        tableFields: FieldsDef.tableFields,
        dataModeFilterableFields: ['name'],
        itemsPerPage: [
          {
            value: 5
          },
          {
            value: 6
          }
        ],
      }
    },
    methods: {
      getBalances: function () {
        console.log("*********** : 23",DonutChartData);
        //let data = {};
        // GET /someUrl
        this.$http.get('http://127.0.0.1:3001/dashboard').then(response => {
          console.log("***** response22: ", response.body);
          //this.donutChartData = response.body.graphPieBtc
          // get body data
          this.donutChartData = {
            labels: ['BTC', 'BCH', 'LTC'],
            datasets: [{
              label: 'value (USD)',
              backgroundColor: ["#f2a900", "#ee8c28", "#04b5e5"],
              data: [30, 30, 90]
            }]
          };

        }, response => {
          // error callback
          console.error(response)
        });


      }
    }
  }
</script>

<style lang="scss" scoped>
  @import "../../../sass/_variables.scss";
  @import "~bootstrap/scss/functions";
  @import "~bootstrap/scss/variables";
  @import "~bootstrap/scss/mixins/breakpoints";

  .chart-container {
    padding: 0 2rem;
    height: 24rem;
  }


</style>
