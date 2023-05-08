document.addEventListener('DOMContentLoaded', () => {
    const starContainers = document.querySelectorAll('.star-container');
    const nightSky = document.querySelector('.night-sky');
    const starsContainer = document.querySelector('.stars-container');

    starContainers.forEach((starContainer, index) => {
        const angle = (index / starContainers.length) * 2 * Math.PI;
        const distance = 50 + Math.random() * 100; // Adjust this value to change the distance of the dots from the pivot point
        const x = 150 + distance * Math.cos(angle);
        const y = 150 + distance * Math.sin(angle);

        starContainer.style.transform = `translate(${x}px, ${y}px)`;
    });

    nightSky.addEventListener('mousemove', (event) => {
        const x = (event.clientX - starsContainer.clientWidth / 2) / 15; // Reduce the value 15 to move the pivot point more towards the cursor
        const y = (event.clientY - starsContainer.clientHeight / 2) / 15; // Reduce the value 15 to move the pivot point more towards the cursor

        starsContainer.style.left = `calc(50% + ${x}px)`;
        starsContainer.style.top = `calc(50% + ${y}px)`;
    });
});
