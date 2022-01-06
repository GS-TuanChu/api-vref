const fs = require('fs');

let files = fs.readdirSync(__dirname)
files.filter(f => f!='index.js' && f.split('.').pop()==='js').forEach(file => {
	require('./'+file)
})

let triggers = Object.keys(Parse.Cloud.triggers.triggers);
for ( let key of triggers ) {
	let [name, className] = key.split('-');
	Parse.Cloud[name](className, async function(request) {
		for ( let fnc of Parse.Cloud.triggers.triggers[key] ) {
			await fnc(request)
		}
	})
}