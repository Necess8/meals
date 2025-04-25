//user page menu toggle 
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menuTog');
    const menuLinks = document.querySelector('.nav-links');
  
    if (menuToggle && menuLinks) {
      menuToggle.addEventListener('click', () => {
        menuLinks.style.display = menuLinks.style.display === 'block' ? 'none' : 'block';
      });
    } else {
      console.log("Menu button or links not found");
    }
  });

  // card slider initialize
document.addEventListener("DOMContentLoaded", function () {

    const swiper = new Swiper(".mySwiper", {
      slidesPerView: 3,
      spaceBetween: 10,
      slidesPerGroup: 1,
      loop: true,
      pagination: {
        el: ".my-pagination",
        clickable: true,
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        });
      });