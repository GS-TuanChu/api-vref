const fs = require('fs');
const roles = require('./roles');
const helper = require('../helper');

let classRole = {}
let files = fs.readdirSync(__dirname);
files.filter(f => f.split('.').shift()==='schema' && f.split('.').pop()==='json').forEach(file => {
	let className = file.split('.')[1]
	classRole[className] = require('./'+file)
})

// protectedFields, indexes ???
// "indexes":{"_id_":{"_id":1},"username_1":{"username":1},"email_1":{"email":1},"case_insensitive_email":{"email":1},"case_insensitive_username":{"username":1}}

let publicFunction = {
	createSchema() {

	},
	createRole() {
		return Promise.all( Object.keys(roles).map(r => {
			let acl = new Parse.ACL();
			acl.setPublicReadAccess(true);

			let role = new Parse.Role(r, acl)
			return role.save(null, { useMasterKey: true })
		}) )
	},
	async updateClassLevelPermissions() {
		let promises = [];
		for ( let className of Object.keys(classRole) ) {
			let response = await helper.apiRequest('schemas/'+className, {
				method: 'PUT',
				body: {
					classLevelPermissions: classRole[className].classLevelPermissions
				}
			});
		}
		return true
	}
}

for (let className of Object.keys(classRole)) {
	var actions = Object.keys(classRole[className].accessControlList);
	if (actions.length == 0) continue;

	Parse.Cloud.triggers.add("beforeSave", className, async function (request) {
		async function getParticipant(name) {
			switch (name) {
				case "me":
					if (className == "_User") return request.object.id;
					return request.object.attributes.createdBy
						? request.object.attributes.createdBy.id
						: Parse.User.current();
					break;
				case "join":
					return request.object.attributes.joinBy
						? request.object.attributes.joinBy.id
						: "";
					break;
				default:
					let query = new Parse.Query(Parse.Role);
					query.equalTo("name", name);
					return query.first({ useMasterKey: true });
					break;
			}
		}
		let acl = new Parse.ACL();
		for (let act of actions) {
			let permConfig = classRole[className].accessControlList[act];
			let participants = [];
			if (typeof permConfig == "string") participants = permConfig;
			else if (
				typeof permConfig == "object" &&
				permConfig.hasOwnProperty("condition")
			) {
				let condition = permConfig.condition.replace(
					/attributes\./gi,
					"request.object.attributes."
				);
				participants = eval(condition)
					? permConfig["true"]
					: permConfig["false"];
			}
			participants = participants.split(",").map((name) => name.trim());
			acl[`setPublic${act}Access`](false);
			for (let p of participants) {
				if (p == "public") {
					acl[`setPublic${act}Access`](true);
				} else {
					let participant = await getParticipant(p);
					if (participant)
						if (p === "me" || p === "join") {
							acl[`set${act}Access`](participant, true);
						} else {
							acl[`setRole${act}Access`](participant, true);
						}
				}
			}
		}
		request.object.setACL(acl);
	});
}

module.exports = {
	publicFunction
}
