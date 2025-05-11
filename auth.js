import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase-config.js';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, username, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Handle successful login
        })
        .catch((error) => {
            const errorMessage = error.message;
            document.getElementById('loginError').textContent = errorMessage;
        });
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    createUserWithEmailAndPassword(auth, username, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Handle successful registration
        })
        .catch((error) => {
            const errorMessage = error.message;
            document.getElementById('registerError').textContent = errorMessage;
        });
});
