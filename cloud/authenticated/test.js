
let publicFunction = {

}

let cloudFunction = [
	{
		name: 'test:needlogin',
		fields: {
			name: {
				required: true,
				type: String,
				options: val => {
					return val.length >= 5
				},
				error: "invalid name"
			}
		},
		async run(req) {
			return {message: `hello ${req.params.name}, your userid is ${req.user.id}`};
		}
	}
]


module.exports = {
	publicFunction, cloudFunction
}