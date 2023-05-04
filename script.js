document.addEventListener("DOMContentLoaded", function() {
    
    // On-hover effect for thumbnails
    const thumbnailContainers = document.querySelectorAll(".thumbnail-container");

    thumbnailContainers.forEach(function(thumbnailContainer) {
        thumbnailContainer.addEventListener("mouseenter", function() {
            this.style.transform = "scale(1.05)";
            this.style.transition = "transform 0.3s";
        });

        thumbnailContainer.addEventListener("mouseleave", function() {
            this.style.transform = "scale(1)";
            this.style.transition = "transform 0.3s";
        });
    });

    // Parallax scrolling effect
    const banner = document.querySelector(".banner");
    window.addEventListener("scroll", function() {
        let scrollPos = window.pageYOffset;
        banner.style.backgroundPositionY = -scrollPos * 0.5 + "px";
    });

    // Shadow effect
    const heading = document.getElementById("shadow");
    const shadowMaxDistance = 30; // Maximum distance (in pixels) for shadow effect
    const shadowMaxLength = 10;    // Maximum length (in pixels) of the shadow

    document.addEventListener('mousemove', (e) => {
    const rect = heading.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const angle = Math.atan2(deltaY, deltaX);

    const shadowLength = Math.min(distance / shadowMaxDistance, 1) * shadowMaxLength;
    const shadowX = -Math.cos(angle) * shadowLength;
    const shadowY = -Math.sin(angle) * shadowLength;

    heading.style.textShadow = `${shadowX}px ${shadowY}px 3px rgba(0, 0, 0, 0.5)`;
    });

    // Resume unveiling
    const resumeIcon = document.getElementById('resume-icon');
    const pdfContainer = document.getElementById('pdf-container');
    const minimizeBtn = document.getElementById('minimize-btn');

    // Store the initial position of the resume icon
    const resumeIconInitialDisplay = window.getComputedStyle(resumeIcon).display;

    resumeIcon.addEventListener('click', () => {
    pdfContainer.style.display = 'block';
    minimizeBtn.style.display = 'block';

    // Hide the resume icon when clicked
    resumeIcon.style.display = 'none';
    });

    minimizeBtn.addEventListener('click', () => {
    pdfContainer.style.display = 'none';
    minimizeBtn.style.display = 'none';

    // Restore the initial position of the resume icon after minimizing
    resumeIcon.style.display = resumeIconInitialDisplay;
});



    // Timeline scroll animation

    // // Initialize ScrollMagic
    // const controller = new ScrollMagic.Controller({ globalSceneOptions: { triggerHook: 0.9 } });

    // // Get all elements with data-animation attribute
    // const timelinePoints = document.querySelectorAll(".timeline-point[data-animation]");

    // // Loop through each element and create a scene
    // timelinePoints.forEach((point) => {
    //     const animation = point.getAttribute("data-animation");

    //     // Create a GSAP timeline for the animation
    //     const timeline = gsap.timeline();
    //     timeline.from(point, { duration: 1, y: 50, autoAlpha: 0 });

    //     // Create a ScrollMagic scene
    //     const scene = new ScrollMagic.Scene({
    //         triggerElement: point,
    //         reverse: false,
    //         // offset: -200, // Remove or comment this line
    //     })
    //         .setTween(timeline)
    //         .addTo(controller);
    // });

});