<template>
  <div class="dashboard">

    <dashboard-info-widgets></dashboard-info-widgets>

    <vuestic-widget class="no-padding no-v-padding">
      <vuestic-tabs
        :names="[$t('dashboard.dataVisualization'), $t('dashboard.usersAndMembers'), $t('dashboard.setupProfile'), $t('dashboard.features')]"
        ref="tabs">
        <div :slot="$t('dashboard.dataVisualization')">
          <data-visualisation-tab></data-visualisation-tab>
        </div>
        <div :slot="$t('dashboard.usersAndMembers')">
          <users-members-tab></users-members-tab>
        </div>
        <div :slot="$t('dashboard.setupProfile')">
          <setup-profile-tab></setup-profile-tab>
        </div>
        <div :slot="$t('dashboard.features')">
          <features-tab></features-tab>
        </div>
      </vuestic-tabs>
    </vuestic-widget>


  </div>
</template>

<script>
  import DashboardInfoWidgets from './DashboardInfoWidgets'
  import UsersMembersTab from './users-and-members-tab/UsersMembersTab.vue'
  import SetupProfileTab from './setup-profile-tab/SetupProfileTab.vue'
  import FeaturesTab from './features-tab/FeaturesTab.vue'
  import DataVisualisationTab from './data-visualisation-tab/DataVisualisation.vue'
  // import DashboardBottomWidgets from './DashboardBottomWidgets.vue'

  // import LineChartData from '../data/charts/LineChartData'
  // console.log("LineChartData: ",LineChartData)

  export default {
    name: 'dashboard',
    components: {
      DataVisualisationTab,
      DashboardInfoWidgets,
      UsersMembersTab,
      SetupProfileTab,
      FeaturesTab,
    },
    created(){
      //this.renderQrcode(this.configs);
      console.log("*********** : 123");
      this.getBalances();

      //load dashboard

      //get updates as they come in

      //setInterval(this.sendData,1000)
      //swal("Payment received!", "TXID: dsafjkhadsfadsfdsfsdafsdfsadfsdf!", "success");

      // this.socket.on('MESSAGE', (data) => {
      //   console.log(data);
      //   console.log("data.invoice: ",data.invoice);
      //
      //
      //   this.sendData()
      // });

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
          console.log("***** response: ",response.body.graphPieBtc);
          // get body data
          this.someData = response.body.graphPieBtc;

        }, response => {
          // error callback
          console.error(response)
        });

        // this.$http
        //   .get('http://127.0.0.1:3001/dashboard', (data) => {
        //     //data = JSON.parse(data)
        //     console.log("***** data: ",data);
        //     // this.uri = data.uri;
        //     // this.depositAddress = data.depositAddress;
        //     // this.invoice = this.$route.params.invoice;
        //     // this.invoiceBTC = data.invoiceBTC;
        //     // this.invoiceDOGE = data.invoiceDOGE;
        //     // this.invoiceSat = data.invoiceSat;
        //     // this.rateBTC = data.rateBTC;
        //     // this.rateDOGE = data.rateDOGE;
        //     // this.rateUSD = data.rateUSD;
        //     // this.statusInvoice = data.state;
        //     // this.payment = data.txidOut;
        //     // this.response = JSON.stringify(data);
        //   })
      },
    }
  }

</script>
<style lang="scss" scoped>
  @import "../../sass/_variables.scss";
</style>
