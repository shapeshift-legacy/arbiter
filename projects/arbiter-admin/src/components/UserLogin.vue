<template>
  <div class="user-login">
    <div class="logo">
      <img src="../../img/arbiter.png" alt="Italian Trulli">
      <!--<i class="material-icons icon">account_balance</i>-->
    </div>
    <div class="app-name">
      Admin<b>Tools</b>
    </div>
    <ApolloMutation
            :mutation="showRegister
        ? require('../graphql/userRegister.gql')
        : require('../graphql/userLogin.gql')"
            :variables="showRegister
        ? {
          input: {
            email,
            password,
            nickname,
            yubikey
          },
        }
        : {
          email,
          password,
          yubikey
        }"
            class="wrapper"
            @done="onDone"
    >
      <form
        slot-scope="{ mutate, loading, gqlError: error }"
        :key="showRegister"
        class="form"
        @submit.prevent="mutate()"
      >
        <input
          v-model="email"
          class="form-input"
          type="email"
          name="email"
          placeholder="Email"
          required
        >
        <input
          v-model="password"
          class="form-input"
          type="password"
          name="password"
          placeholder="Password"
          required
        >
        <input
          v-if="showRegister"
          v-model="nickname"
          class="form-input"
          name="nickname"
          placeholder="Nickname"
          required
        >
        <input
          v-model="yubikey"
          class="form-input"
          name="yubikey"
          placeholder="yubikey"
          required
        >
        <div v-if="error" class="error">{{ error.message }}</div>
        <template v-if="!showRegister">
          <button
                  type="submit"
                  :disabled="loading"
                  class="button"
          >Login</button>
          <div class="actions">
            <a @click="showRegister = true">Create an account</a>
          </div>
        </template>
        <template v-else>
          <button
            type="submit"
            :disabled="loading"
            class="button"
          >Create new account</button>
          <div class="actions">
            <a @click="showRegister = false">Go back</a>
          </div>
        </template>
      </form>
    </ApolloMutation>
  </div>
</template>

<script>
import UserCurrent from '../mixins/UserCurrent'
import USER_CURRENT from '../graphql/userCurrent.gql'
import { onLogin } from '../vue-apollo'

export default {
  name: 'UserLogin',

  mixins: [
    UserCurrent,
  ],

  data () {
    return {
      showRegister: false,
      email: '',
      password: '',
      nickname: '',
      yubikey: '',
    }
  },

  watch: {
    // If already logged in redirect to other page
    userCurrent (value) {
      if (value) {
        this.redirect()
      }
    },
  },

  methods: {
    async onDone (result) {
      if (this.showRegister) {
        this.showRegister = false
      } else {
        if (!result.data.userLogin) return
        const apolloClient = this.$apollo.provider.defaultClient
        // Update token and reset cache
        const { id, userId, expiration } = result.data.userLogin.token
        await onLogin(apolloClient, { id, userId, expiration })
        // Update cache
        apolloClient.writeQuery({
          query: USER_CURRENT,
          data: {
            userCurrent: result.data.userLogin.user,
          },
        })
      }
    },

    redirect () {
      this.$router.replace(this.$route.params.wantedRoute || { name: 'home' })
    },
  },
}
</script>

<style lang="stylus" scoped>
  @import '~@/style/imports'

  .user-login
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content center

  .logo
    .icon
      font-size 80px
      color $color

  .app-name
    font-size 42px
    font-weight lighter
    margin-bottom 32px

  .wrapper
    flex auto 0 0

  .form
    width 100vw
    max-width 300px

  .form-input,
  .button
    display block
    width 100%
    box-sizing border-box

  .form-input
    margin-bottom 12px

  .actions
    margin-top 12px
    text-align center
    font-size 12px
</style>
