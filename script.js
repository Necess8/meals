// js for menu button
const menuBtn = document.querySelector('.menuBtn');
const navlink = document.querySelector('.nav-link');

menuBtn.addEventListener('click', ()=>{
    navlink.classList.toggle('mobile-menu')
});

// js for sign in and register

const container = document.querySelector('.container');
const registerBtn = document.querySelector('.registerr-btn');
const loginBtn = document.querySelector('.loginn-btn');

  registerBtn.addEventListener('click', () => {
    container.classList.add('active');
  });

  loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
  });