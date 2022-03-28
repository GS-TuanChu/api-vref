const helper = require('../helper')
const Product = require('../helper/Product')

let publicFunction = {}

let cloudFunction = [
    {
        name: 'product:list',
        fields: {},
        async run(req) {
            const productQuery = new Parse.Query('Product')
            const products = await productQuery.find({
                sessionToken: req.user.getSessionToken(),
            })
            return { products }
        },
    },
    {
        name: 'product:getProductDetail',
        fields: {
            pid: {
                required: true,
                type: String,
                options: (val) => {
                    return val.length > 5
                },
                error: 'INVALID_PRODUCT',
            },
        },
        async run(req) {
            let { pid } = req.params
            const product = await Product.get(pid)
            return { product }
        },
    },
    {
        name: 'product:editProduct',
        fields: {
            pid: {
                required: true,
                type: String,
                options: (val) => {
                    return val.length > 5
                },
                error: 'INVALID_PRODUCT',
            },
        },
        async run(req) {
            let { pid } = req.params
            const product = await Product.get(pid)
            const fields = ['name', 'description', 'price', 'contact']
            fields.forEach((f) => product.set(f, req.params[f]))
            return product
                .save(null, {
                    sessionToken: req.user.getSessionToken(),
                })
                .then((res) => ({ id: res.id }))
        },
    },
    {
        name: 'product:deleteProduct',
        fields: {
            pid: {
                required: true,
                type: String,
                options: (val) => {
                    return val.length > 5
                },
                error: 'INVALID_PRODUCT',
            },
        },
        async run(req) {
            let { pid } = req.params
            const product = await Product.get(pid)
            product.destroy({ sessionToken: req.user.getSessionToken() })
        },
    },
]

module.exports = {
    publicFunction,
    cloudFunction,
}
