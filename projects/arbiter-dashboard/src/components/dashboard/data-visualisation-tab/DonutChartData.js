import store from 'vuex-store'

let palette = store.getters.palette

export default {
  labels: ['BTC', 'BCH', 'DOGE'],
  datasets: [{
    label: 'value (USD)',
    backgroundColor: [palette.info, palette.warning, palette.primary],
    data: [30, 30, 90]
  }]
}
