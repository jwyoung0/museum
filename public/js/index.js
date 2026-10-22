document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".slide");

    if (!slides.length) {
        return;
    }

    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => {
            slide.classList.remove("active");
        });

        slides[index].classList.add("active");
    }

    setInterval(() => {
        currentSlide++;

        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }

        showSlide(currentSlide);
    }, 5000);
});