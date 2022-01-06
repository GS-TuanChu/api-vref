
// Parse.Cloud.triggers.add("afterSave", "Campaign", async function(request) {
// 	// when add new campaign, add the root node of campaign

// 	var User = Parse.Object.extend(Parse.User);
// 	var userRef = new User();
// 	userRef.id = 'DpF3DFbVp0'; // treasury

// 	let query = new Parse.Query("Node");
//     query.equalTo("campaign", request.object);
//     query.equalTo("user", userRef);
//     let root = await query.first({ useMasterKey: true });
//     if ( root ) return true;

// 	const Node = Parse.Object.extend("Node");
// 	let node = new Node();
// 	node.set("ref", null);
// 	node.set("user", userRef);
// 	node.set("campaign", request.object);
// 	node.set("transactionId", 'root');

// 	return node.save(null,{ useMasterKey: true }).then(res => ({ id: res.id }));
// })
