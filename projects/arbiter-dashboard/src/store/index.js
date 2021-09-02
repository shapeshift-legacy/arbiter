import Vue from 'vue'
import Vuex from 'vuex'
import VuexI18n from 'vuex-i18n' // load vuex i18n module

import app from './modules/app'
import menu from './modules/menu'

import * as getters from './getters'

Vue.use(Vuex)

const store = new Vuex.Store({
  strict: true, // process.env.NODE_ENV !== 'production',
  getters,
  modules: {
    app,
    menu
  },
  actions: {
  },
  state: {
    lineChartData:
      {
        labels:['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
          {
            label: 'BTC',
            backgroundColor: "#66ee8c28",
            borderColor: "",
            data: [40, 40, 40, 40, 40, 45, 50]
          },
          {
            label: 'LTC',
            backgroundColor: "#66ee8c28",
            borderColor: "",
            data: [20, 20, 20, 20, 20, 15, 10]
          }
        ]
      }
  },
  mutations: {}
})

Vue.use(VuexI18n.plugin, store)

export default store
