
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function checkSig(params, secret) {
	// let params = JSON.parse(JSON.stringify(params)) // clone object
	let sig = params['sig']
	delete params['sig'];

	var keys = Object.keys(params);
	keys.sort();

	let str = '';
	for (let key of keys) { // now lets iterate in sort order
	    str += `${key}=${params[key]}&`
	}
	str += secret
	console.log("str", str, crypto.createHash('md5').update(str).digest("hex"))
	return sig==crypto.createHash('md5').update(str).digest("hex");
}

let modules = [
	{
		name: 'global',
		async validate(req, functionName) {
			return true
		}
	},
	{
		name: 'authenticated',
		async validate(req, functionName) {
			return true
		},
		options: {
			requireUser: true
		}
	},
	{
		name: 'admin',
		async validate(req, functionName) {
			let adminRoleQuery = new Parse.Query(Parse.Role);
			adminRoleQuery.equalTo('name', 'admin');
			adminRoleQuery.equalTo('users', req.user);
			let found = await adminRoleQuery.first()
			return found
		},
		options: {
			requireUser: true
		}
	},
	{
		name: 'api',
		async validate(req, functionName) {
			if ( !req.params.appId || !req.params.sig ) return false;
			let apiQuery = new Parse.Query("RemoteAccess");
			apiQuery.include("user")
			let app = await apiQuery.get(req.params.appId.toString(), { useMasterKey: true });
			if ( !app || !checkSig(req.params, app.get("secret")) ) return false;
			req.user = app.get("user");
			return true
		}
	}
];

for ( let mdl of modules ) {
	fs.readdir(__dirname+'/'+mdl.name, (err, files) => {
		if ( err ) return false;
		for ( let file of files ) {
			if ( file.split('.').pop()!='js' ) return;
			let fncs = require(`./${mdl.name}/${file}`)
			for ( let fnc of fncs.cloudFunction ) {
				let options = Object.assign({}, mdl.options);
				if ( fnc.fields ) options.fields = fnc.fields;
				Parse.Cloud.define(fnc.name, async function(req) {

					if ( !mdl.validate || await mdl.validate(req, fnc.name) )
						return fnc.run(req)
					else return {error: "invalid_request"}
				}, options)
			}
		};
	})
}

Parse.Cloud.triggers = {
	triggers: {},
	add(name, className, action) {
		let key = `${name}-${className}`
		if ( !this.triggers[key] ) this.triggers[key] = [];
		this.triggers[key].push(action)
	}
}
require('./schema')
require('./triggers')
