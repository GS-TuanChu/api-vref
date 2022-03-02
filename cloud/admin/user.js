const helper = require('../helper');

let publicFunction = {};

let cloudFunction = [
    {
        name: 'user:list',
        fields: {},
        async run(req) {
            const userQuery = new Parse.Query('User');
            const users = await userQuery.find({
                sessionToken: req.user.getSessionToken(),
            });
            return { users };
        },
    },
    {
        name: 'user:edit',
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
                sessionToken: req.user.getSessionToken(),
            });
            const fields = [
                'username',
                'email',
                'fullname',
                'avatar',
                'phone',
                'bankAccount',
                'balance',
                'balanceToken',
            ];
            fields.forEach((f) => user.set(f, req.params[f]));
            return user
                .save(null, { sessionToken: req.user.getSessionToken() })
                .then((res) => ({ id: res.id }));
        },
    },
    {
        name: 'user:delete',
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
                sessionToken: req.user.getSessionToken(),
            });
            return user.destroy({ sessionToken: req.user.getSessionToken() });
        },
    },
    {
        name: 'user:editRole',
        fields: {
            uid: {
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
            let { uid, role, operation } = req.params;
            const userQuery = new Parse.Query('User');
            userQuery.equalTo('objectId', uid);
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
                        sessionToken: req.user.getSessionToken(),
                    });
                }
            }
        },
    },
];

module.exports = {
    publicFunction,
    cloudFunction,
};
