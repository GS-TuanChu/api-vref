const helper = require('../helper');

Parse.Cloud.afterLogout(async function(request) {
  // remove notification of user
  let md5Session = helper.md5(request.user.getSessionToken());
  let query = new Parse.Query("Devices");
  query.equalTo("loginSession", md5Session);
  let device = await query.first({ useMasterKey: true });
  return device.destroy({ useMasterKey: true })
})