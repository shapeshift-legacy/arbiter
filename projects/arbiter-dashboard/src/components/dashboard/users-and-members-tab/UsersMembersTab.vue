<template>
  <div class="users-members-tab dashboard-tab">
    <div class="row">
      <div class="col-md-12 align-items-center">
        <vuestic-widget class="chart-widget" :headerText="'charts.lineChart' | translate">
          <vuestic-chart :data="lineChartData" type="line"></vuestic-chart>
        </vuestic-widget>
      </div>
    </div>
  </div>
</template>

<script>

  import utils from 'services/utils'
  import store from 'vuex-store'

  export default {
    name: 'users-members-tab',
    created(){
      //this.renderQrcode(this.configs);
      console.log("*********** : 123");
      this.getBalances();

    },
    data () {
      return {
        //lineChartData:""
        lineChartData:
          {
            labels:['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
            {
              label: 'BTC',
              backgroundColor: "#FF9900",
              borderColor: "",
              data: [1, 1, 1, 1, 1, .5, .2]
            },
            {
              label: 'LTC',
              backgroundColor: "#33bf135c",
              borderColor: "",
              data: [20, 20, 20, 20, 20, 15, 10]
            },
            {
              label: 'ETH',
              backgroundColor: "#33FF9900",
              borderColor: "",
              data: [22, 22, 26, 21, 19, 15, 10]
            }
          ]
        }
      }
    },
    methods: {
      launchEpicmaxToast () {
        // this.showToast(`Let's work together!`, {
        //   icon: 'fa-star-o',
        //   position: 'top-right',
        //   duration: Infinity,
        //   action: {
        //     text: 'Hire us',
        //     href: 'http://epicmax.co/#/contact',
        //     class: 'vuestic-toasted-link'
        //   }
        // })
      },
      getBalances: function() {
        console.log("*********** : 23");
        //let data = {};
        // GET /someUrl
        this.$http.get('http://127.0.0.1:3001/dashboard').then(response => {
          console.log("***** response: ",response.body.lineChartBalance);
          // get body data
          this.lineChartData = JSON.parse(response.body.lineChartBalance)
          //this.lineChartData =
        }, response => {
          // error callback
          console.error(response)
        });
      },
    }
  }
</script>

<style lang="scss" scoped>
  @import "../../../sass/_variables.scss";
  @import "~bootstrap/scss/functions";
  @import "~bootstrap/scss/variables";
  @import "~bootstrap/scss/mixins/breakpoints";


  .vuestic-profile-card {
    margin-left: 1rem;

    @include media-breakpoint-up(md) {
      margin-top: -$tab-content-pt;
    }

    @include media-breakpoint-down(md) {
      margin-bottom: $tab-content-pt;
      margin-left: 0;
    }
  }


</style>
