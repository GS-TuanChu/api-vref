const helper = require('../helper');

Parse.Cloud.triggers.add("afterSave", "Node", async function(request) {
	var newObj = request.object;
  	var oldObj = request.original;
  	if ( oldObj ) return true; // ignore when update

  	// only update count when insert new row
	try {
		let nodeRef = newObj.get('ref')
		if ( nodeRef && nodeRef.length ) {
			for ( let i=0; i<nodeRef.length; i++ ) {
				let node = helper.createObject("Node", nodeRef[i])
				console.log(i, nodeRef[i], i==nodeRef.length-1 ? "child" : "grandchild")
				node.increment(i==nodeRef.length-1 ? "child" : "grandchild")
				await node.save(null, {useMasterKey:true})
			}
		}
	} catch(e) {
		console.log("afterSave node", {e})
	}
})

Parse.Cloud.triggers.add("afterDelete", "Node", async function(request) {
	try {
		let nodeRef = request.object.get('ref')
		if ( nodeRef && nodeRef.length ) {
			for ( let i=0; i<nodeRef.length; i++ ) {
				let node = helper.createObject("Node", nodeRef[i])
				node.decrement(i==nodeRef.length-1 ? "child" : "grandchild")
				await node.save(null, {useMasterKey:true})
			}
		}
	} catch(e) {
		console.log("afterDelete node", {e})
	}
})