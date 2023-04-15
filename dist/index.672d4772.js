document.addEventListener("DOMContentLoaded", function() {
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
});

//# sourceMappingURL=index.672d4772.js.map
