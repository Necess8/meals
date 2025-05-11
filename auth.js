// auth.js - Authentication functions (for script-based Firebase setup)
// Register a new user
function registerUser(username, password) {
    document.getElementById("registerError").textContent = "Creating account...";
    document.getElementById("registerError").style.display = "block";

    const usersRef = database.ref("users");

    usersRef.orderByChild("username").equalTo(username).once("value")
        .then(snapshot => {
            if (snapshot.exists()) {
                document.getElementById("registerError").textContent = "Username already exists. Please choose another.";
                return;
            }

            const newUserRef = usersRef.push();
            const userId = newUserRef.key;

            newUserRef.set({
                username: username,
                password: password,
                createdAt: new Date().toISOString()
            })
            .then(() => {
                sessionStorage.setItem("user_id", userId);
                sessionStorage.setItem("username", username);
                window.location.href = "userpage.html";
            })
            .catch(error => {
                document.getElementById("registerError").textContent = "Error creating account: " + error.message;
            });
        })
        .catch(error => {
            document.getElementById("registerError").textContent = "Error checking username: " + error.message;
        });
}

// Sign in existing user
function signIn(username, password) {
    document.getElementById("loginError").textContent = "Signing in...";
    document.getElementById("loginError").style.display = "block";

    const usersRef = database.ref("users");

    usersRef.orderByChild("username").equalTo(username).once("value")
        .then(snapshot => {
            if (!snapshot.exists()) {
                document.getElementById("loginError").textContent = "Username not found.";
                return;
            }

            let userId = null;
            let userData = null;

            snapshot.forEach(childSnapshot => {
                userId = childSnapshot.key;
                userData = childSnapshot.val();
            });

            if (userData.password !== password) {
                document.getElementById("loginError").textContent = "Incorrect password.";
                return;
            }

            database.ref(`users/${userId}`).update({
                lastLogin: new Date().toISOString()
            });

            sessionStorage.setItem("user_id", userId);
            sessionStorage.setItem("username", username);
            window.location.href = "userpage.html";
        })
        .catch(error => {
            document.getElementById("loginError").textContent = "Error signing in: " + error.message;
        });
}

// Sign out
function signOut() {
    sessionStorage.removeItem("user_id");
    sessionStorage.removeItem("username");
    window.location.href = "index.html";
}

// Get current user
function getCurrentUser() {
    const userId = sessionStorage.getItem("user_id");
    const username = sessionStorage.getItem("username");

    if (userId && username) {
        return { userId, username };
    }

    return null;
}
