<template>
  <div>
    reports
    <a href="../../assets/test.txt" download>report01.csv</a>

  </div>

</template>

<script>
  export default {
    name: 'features-tab'
  }
</script>

<style lang="scss" scoped>
  @import "../../../sass/_variables.scss";
  @import "~bootstrap/scss/functions";
  @import "~bootstrap/scss/variables";
  @import "~bootstrap/scss/mixins/breakpoints";

  .overview-item {
    display: flex;
    align-items: center;
    height: 55px;
    margin-bottom: 3rem;
    padding-right: 1rem;
    font-size: 1.25rem;
    font-weight: bold;

    .overview-icon-container {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: row;
      min-width: 85px;
      max-width: 85px;
      height: 100%;
    }
  }

  .overview-row {
    @include media-breakpoint-down(xs) {
      flex-wrap: wrap;
    }
  }

  .overview-col:first-child {
    margin-left: 2rem;
    @include media-breakpoint-down(md) {
      margin-left: 0;
    }
  }

  .explore-btn {
    margin-top: 6rem;
    margin-bottom: 1rem;
  }

</style>
