import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from './index.html'; // Import from HTML file

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Logged in:', userCredential.user);
        window.location.href = 'home.html'; // Redirect on success
    } catch (error) {
        document.getElementById('loginError').textContent = error.message;
    }
});

// Registration Form Handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Registered:', userCredential.user);
        window.location.href = 'home.html'; // Redirect on success
    } catch (error) {
        document.getElementById('registerError').textContent = error.message;
    }
});

// Toggle Between Forms (Add your existing UI toggle logic here)