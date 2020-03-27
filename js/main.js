{

/* ========================
  Variables
======================== */

const FIREBASE_AUTH = firebase.auth();
const FIREBASE_MESSAGING = firebase.messaging();
const FIREBASE_DATABASE = firebase.database();

const signInButton = document.getElementById("SignIn");
const signOutButton = document.getElementById("SignOut");
const subscribeButton = document.getElementById("subscribe");
const subscribeOutButton = document.getElementById("subscribeOut");
const sendNotificationForm = document.getElementById("send-notification-form");


/* ========================
  Event Listeners
======================== */

signInButton.addEventListener('click', signIn);
signOutButton.addEventListener('click', signOut);
subscribeButton.addEventListener('click', subscribeToNotifications);
subscribeOutButton.addEventListener('click', subscribeOutNotifications);

sendNotificationForm.addEventListener('submit', sendNotification);

FIREBASE_AUTH.onAuthStateChanged(handleAuthStateChange);
FIREBASE_MESSAGING.onTokenRefresh(handleTokenRefresh);

/* ========================
  Functions
======================== */

function signIn() {
  FIREBASE_AUTH.signInWithPopup( new firebase.auth.GoogleAuthProvider );
}

function signOut() {
  FIREBASE_AUTH.signOut();
}

function handleAuthStateChange(user) {
  if(user){
    console.log(user);

    signInButton.setAttribute("hidden", true);
    signOutButton.removeAttribute("hidden");

    checkSubscription();
  } else {
    console.log("no user");

    signOutButton.setAttribute("hidden", true);
    signInButton.removeAttribute("hidden");

  }
}

  function subscribeToNotifications() {

    FIREBASE_MESSAGING.requestPermission()
      .then(() => FIREBASE_MESSAGING.getToken())
      .then((token) => {
        console.log(token);

        FIREBASE_DATABASE.ref('/tokens').push({
          token: token,
          uid: FIREBASE_AUTH.currentUser.uid
        });
      })
      .then(() => checkSubscription())
      .catch(() => console.log('nincs token'));
    
    /*
      .then(() => handleTokenRefresh)
      .catch(() => console.log("user didn't give permission"));
*/
  }

  function handleTokenRefresh() {
    return FIREBASE_MESSAGING.getToken()
    .then((token) => {
      FIREBASE_DATABASE.ref('/tokens').push({
        token: token,
        uid: FIREBASE_AUTH.currentUser.uid
      });
    });
  }

  function subscribeOutNotifications() {
    FIREBASE_MESSAGING.getToken()
      .then((token) => FIREBASE_MESSAGING.deleteToken(token))
      .then(() => FIREBASE_DATABASE.ref('/tokens').orderByChild("uid").equalTo(FIREBASE_AUTH.currentUser.uid)
      .once('value'))
      .then((snapshot) => {
        console.log(snapshot.val());
        const key = Object.keys(snapshot.val())[0];
        return FIREBASE_DATABASE.ref('/tokens').child(key).remove();
      })
      .then(() => checkSubscription())
  }

  function checkSubscription() {
    FIREBASE_DATABASE.ref('/tokens').orderByChild("uid").equalTo(FIREBASE_AUTH.currentUser.uid).once('value')
      .then((snapshot) => {
        if(snapshot.val()){
          subscribeButton.setAttribute("hidden", "true");
          subscribeOutButton.removeAttribute("hidden");
        } else {
          subscribeOutButton.setAttribute("hidden", "true");
          subscribeButton.removeAttribute("hidden");
          
        }
      })
  }

  function sendNotification(e) {
    e.preventDefault();

    const notificationMessage = document.getElementById('notification-message').value;

    FIREBASE_DATABASE.ref('/notifications').push({
      user: FIREBASE_AUTH.currentUser.displayName,
      message: notificationMessage,
      profilePicture: FIREBASE_AUTH.currentUser.photoURL
    }).then(() => {
      document.getElementById('notification-message').value = '';
      console.log('submit');
    })
  }

}