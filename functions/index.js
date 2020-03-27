
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendNotifications = functions.database.ref('/notifications/{notificationId}').onWrite((change, context) => {

  if (change.before.exists() || !change.after.exists() ) {
    //Do nothing if data is edited or deleted
    console.log('Message edited or deleted - skip');
    return;
  }
/*
  // Exit when the data is deleted
  if (!event.data.exists()) {
    return;
  }
*/
  // Setup notification
  const NOTIFICATION_SNAPSHOT = change.after;
  const payload = {
    notification: {
      title: `New Message from ${NOTIFICATION_SNAPSHOT.val().user}!`,
      body: NOTIFICATION_SNAPSHOT.val().message,
      icon: NOTIFICATION_SNAPSHOT.val().profilePicture,
      click_action: 'https://simplynotify-fd89f.web.app/'
    }
  }

    console.info(payload);
  
    function deleteNotificationsWithDelay(NOTIFICATION_SNAPSHOT) {
        setTimeout(admin.database().ref("/notifications").child(NOTIFICATION_SNAPSHOT.key).remove(), 10000);
    }

    function cleanInvalidTokens(tokensWithKey, results) {
        const invalidTokens = [];

        results.forEach((results, index) => {
            if(!results.error) return;

            console.error("error with token");

            switch(results.error.code) {
                case "messaging/invalid-registration-token":
        case "messaging/registration-token-not-registered":
          invalidTokens.push( admin.database().ref('/tokens').child(tokensWithKey[index].key).remove() );
          break;
        default:
          break;
            }
        });

        return Promise.all(invalidTokens);
    }

    return admin.database().ref('/tokens').once('value').then((data) => {
        if(!data.val()) return;

        const snapshot = data.val();
        const tokensWithKey = [];
        const tokens = [];

        for (let key in snapshot) {
            tokens.push(snapshot[key].token);
            tokensWithKey.push({
                token: snapshot[key].token,
                key: key
            });
        }

        return admin.messaging().sendToDevice(tokens, payload)
            .then((response) => cleanInvalidTokens(tokensWithKey, response.results))
            .then(() => deleteNotificationsWithDelay(NOTIFICATION_SNAPSHOT))
    });
});
