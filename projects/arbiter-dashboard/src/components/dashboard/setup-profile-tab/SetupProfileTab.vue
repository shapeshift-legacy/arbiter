<template>

  <div class="setup-profile-tab dashboard-tab">
  <div class="col-md-12">
    <vuestic-data-table
      :apiMode="apiMode"
      :tableData="tableData"
      :tableFields="tableFields"
      :itemsPerPage="itemsPerPage"
      :onEachSide="onEachSide"
      :sortFunctions="sortFunctions"
      :dataModeFilterableFields="dataModeFilterableFields"
    />
  </div>
  </div>
</template>

<script>
  import Vue from 'vue'
  import CountriesList from 'data/CountriesList'

  import TableData from './TableData'
  import FieldsDef from './fields-definition'


  export default {
    name: 'setup-profile-tab',

    data () {
      return {
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
    }
  }


</script>

<style lang="scss" scoped>
  @import "../../../sass/_variables.scss";
  @import "~bootstrap/scss/functions";
  @import "~bootstrap/scss/variables";
  @import "~bootstrap/scss/mixins/breakpoints";

  .form-group {
    min-width: 200px;
    max-width: 360px;
    width: 80%;
  }

  .wizard-completed-tab {
    @include media-breakpoint-up(md) {
      margin-top: -$tab-content-pt;
    }
  }

</style>
