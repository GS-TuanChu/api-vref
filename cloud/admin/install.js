const Schema = require('../schema');

let publicFunction = {

}

let cloudFunction = [
	{
		name: 'install:updateClassLevelPermissions',
		async run(req) {
			return Schema.publicFunction.updateClassLevelPermissions()
		}
	}
]


module.exports = {
	publicFunction, cloudFunction
}