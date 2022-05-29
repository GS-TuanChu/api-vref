const helper = require('../helper');
const TokenTransaction = require("../helper/TokenTransaction")
const UserHelper = require("../helper/User")

let publicFunction = {};

let cloudFunction = [
    {
        name: 'user:list',
        fields: {},
        async run(req) {
            const {limit, skip} = req.params
            const userQuery = new Parse.Query(Parse.User);
            if (limit) userQuery.limit(limit)
            if (skip) userQuery.skip(skip)
            userQuery.ascending("email")
            const users = await userQuery.find({
                useMasterKey: true,
            });

            return Promise.all(
                users.map(async (user) => {
                    const rolesQuery = new Parse.Query(Parse.Role);
                    rolesQuery.equalTo('users', user);
                    const roles = await rolesQuery.find({ useMasterKey: true });
                    const res = []
                    for (let i = 0; i < roles.length; ++i) {
                      res.push(roles[i].get('name'))
                    }
                    return {
                        user,
                        roles: res,
                    };
                })
            );
        },
    },
    {
        name: 'user:getUserDetail',
        fields: {
            uid: {
                required: true,
                type: String,
                error: 'INVALID_USER',
            },
        },
        async run(req) {
            let { uid } = req.params;
            const userQuery = new Parse.Query('User');
            userQuery.equalTo('objectId', uid);
            const user = await userQuery.first({
                useMasterKey: true,
            });
            const rolesQuery = new Parse.Query(Parse.Role);
            rolesQuery.equalTo('users', user);
            const roles = await rolesQuery.find({ useMasterKey: true });
            const res = []
            for (let i = 0; i < roles.length; ++i) {
              res.push(roles[i].get('name'))
            }
            return { user, roles: res };
        },
    },
    {
        name: 'user:edit',
        fields: {
            id: {
                required: true,
                type: String,
                error: 'INVALID_USER',
            },
        },
        async run(req) {
            let t0 = performance.now()
            let { id, amount } = req.params;
            const user = await UserHelper.getById(id)
            if (amount) {
              await TokenTransaction.updateAmount(amount, user)
            } else {
              const fields = [
                  'username',
                  'email',
                  'fullname',
                  'avatar',
                  'phone',
                  'bankAccount',
                  'balanceToken',
              ];
              fields.forEach((f) => user.set(f, req.params[f]));
            }
            const res = await user.save(null, { sessionToken: req.user.getSessionToken() })
            let t1 = performance.now()
            console.log("#### ", t1 - t0)
            return {id: res.id}
        },
    },
    {
        name: 'user:editRole',
        fields: {
            id: {
                required: true,
                type: String,
                error: 'INVALID_USER',
            },
            role: {
                required: true,
                type: String,
                options: (val) => {
                    const ROLES = {
                        admin: 'admin',
                        server: 'server',
                        marketing: 'marketing',
                        customer_support: 'customer_support',
                    };
                    return Boolean(Object.keys(ROLES).find((r) => r === val));
                },
                error: 'INVALID_ROLE',
            },
            operation: {
                required: true,
                type: String,
                options: (val) => {
                    const OPERATIONS = {
                        add: 'add',
                        remove: 'remove',
                    };
                    return Boolean(
                        Object.keys(OPERATIONS).find((op) => op === val)
                    );
                },
                error: 'INVALID_OPERATION',
            },
        },
        async run(req) {
            let { id, role, operation } = req.params;
            const userQuery = new Parse.Query('User');
            userQuery.equalTo('objectId', id);
            const user = await userQuery.first({
                sessionToken: req.user.getSessionToken(),
            });
            if (user) {
                let roleQuery = new Parse.Query(Parse.Role);
                roleQuery.equalTo('name', role);
                let roleRecord = await roleQuery.first();
                if (roleRecord) {
                    roleRecord
                        .getUsers({ sessionToken: req.user.getSessionToken() })
                        [operation](user);
                    roleRecord.save(null, {
                      useMasterKey: true
                    });
                }
            }
        },
    },

    {
      name: 'user:search',
      fields: {},
      async run(req) {
        const { searchText } = req.params
        const userQuery = new Parse.Query('User');
        userQuery.fullText("username", searchText)
        const users = await userQuery.find({useMasterKey: true})
        return Promise.all(
            users.map(async (user) => {
                const rolesQuery = new Parse.Query(Parse.Role);
                rolesQuery.equalTo('users', user);
                const roles = await rolesQuery.find({ useMasterKey: true });
                const res = []
                for (let i = 0; i < roles.length; ++i) {
                  res.push(roles[i].get('name'))
                }
                return {
                    user,
                    roles: res,
                };
            })
        );
      }
    }
];

module.exports = {
    publicFunction,
    cloudFunction,
};
