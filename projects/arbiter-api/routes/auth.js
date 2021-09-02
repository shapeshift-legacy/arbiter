const config = require("../configs/env")
//console.log(config)
const jwt     = require('jsonwebtoken');
const _       = require('lodash')
// const util = require('@arbiter/arb-redis')// const subscriber = util.subscriber
// const publisher = util.publisher
// const redis = util.redis

/*
    Auth module

    Forked from Zues
            -Highlander
 */

// XXX: This should be a database of users :).
var users = [
    {
        id: 1,
        username: 'gonto',
        password: 'gonto'
    },
    {
        id: 2,
        username: 'test',
        password: 'test'
    }
];

function createToken(user) {
    return jwt.sign(_.omit(user, 'password'), config.SECRET);
}

function getUserScheme(req) {
    // let req = ctx.request
    // console.log()
    var username;
    var type;
    var userSearch = {};

    // The POST contains a username and not an email
    if(req.body.username) {
        username = req.body.username;
        type = 'username';
        userSearch = { username: username };
    }
    // The POST contains an email and not an username
    else if(req.body.email) {
        username = req.body.email;
        type = 'email';
        userSearch = { email: username };
    }

    return {
        username: username,
        type: type,
        userSearch: userSearch
    }
}

//map
const api = {
    users: (ctx) => {
        console.log(ctx.request)
        let req = ctx.request
        var userScheme = getUserScheme(req);

        if (!userScheme.username || !req.body.password) {
            ctx.body ="You must send the username and the password"
        }

        if (_.find(users, userScheme.userSearch)) {
            ctx.body = "A user with that username already exists"
        }

        var profile = _.pick(req.body, userScheme.type, 'password', 'extra');
        profile.id = _.max(users, 'id').id + 1;

        users.push(profile);

        ctx.body = {
            id_token: createToken(profile)
        }
    },
    createSession: async (ctx) => {
        console.log(ctx.request)
        let req = ctx.request

        var userScheme = getUserScheme(req);

        if (!userScheme.username || !req.body.password) {
            ctx.body ="You must send the username and the password"
        }

        var user = _.find(users, userScheme.userSearch);

        if (!user) {
            ctx.body = {message:"The username or password don't match", user: user}
        }

        if (user.password !== req.body.password) {
            ctx.body ="The username or password don't match"
        }

        //TODO save in mongo? redis?

        ctx.body ={
            id_token: createToken(user)
        }
    },
};

module.exports = api
