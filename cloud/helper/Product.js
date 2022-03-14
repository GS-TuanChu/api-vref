const helper = require('../helper')

module.exports = {
    get(id) {
        let query = new Parse.Query('Product')
        return query.get(id, { useMasterKey: true })
    },
}
