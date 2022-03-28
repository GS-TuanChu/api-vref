const crypto = require('crypto')
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const axios = require('axios').default;
const config = require('../config');

module.exports = {
	now() {
	    const date = new Date();
	    return parseInt(date.getTime() / 1000);
	},
	validateEmail(email) {
		const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(String(email).toLowerCase());
	},
	apiRequest(path, options) {
		return Parse.Cloud.httpRequest({
			url: 'https://parseapi.back4app.com/'+path,
			headers: {
				'X-Parse-Application-Id': '9c3Op8G4q48naSYgOxP3ooYMzTflYSupbvPL1nLF',
				'X-Parse-Master-Key': 'qF6Sq74S5j4QaC88jkm2Y6PR6MLzrDoGILXkusRj',
				'Content-Type': 'application/json'
			},
			...options
		})
	},
	createObject(className, objId) {
		let ParseClass = Parse.Object.extend(className);
		let instance = new ParseClass();
		instance.id = objId;
		return instance
	},
	encrypt(text) {
		const iv = crypto.randomBytes(16);
	    const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
	    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
	    return {
	        iv: iv.toString('hex'),
	        content: encrypted.toString('hex')
	    };
	},
	decrypt(hash) {
	    const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, Buffer.from(hash.iv, 'hex'));
	    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
	    return decrpyted.toString();
	},
	md5(data) {
		return crypto.createHash('md5').update(data).digest("hex");
	},
	formatPhone(phone) {
		return phone.replace(/\D/g,'');
	},
	getPhoneFromFirebase(uid) {
		return axios.get('https://us-central1-vinet-1927a.cloudfunctions.net/app/api/uid/'+uid, {
			timeout: 10000,
			responseType: 'json'
		}).then(function (response) {
			return response.data;
		})
		.catch(function (error) {
			// handle error
			console.log(error);
			return false;
		});
	},
	getUserToken(user) {
		if ( user.useMasterKey || user.id==config.treasuryUser.id || user.id==config.campaignBonusUser.id )
			return { useMasterKey: true };
		else return { sessionToken: user.getSessionToken() };
	}
}


