
let publicFunction = {

}

let cloudFunction = [
	{
		name: 'test:admin',
		async run(req) {
			return {message: `hello admin ${req.user.id}`};
		}
	}
]


module.exports = {
	publicFunction, cloudFunction
}