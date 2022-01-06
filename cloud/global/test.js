const Schema = require('../schema');

let publicFunction = {

}

let cloudFunction = [
	{
		name: 'test:global',
		async run(req) {
		    return {message: `hello world`};
		}
	},
	// {
	// 	name: 'global:updateClassLevelPermissions',
	// 	async run(req) {
	// 		return Schema.publicFunction.updateClassLevelPermissions()
	// 	}
	// }
]

module.exports = {
	publicFunction, cloudFunction
}