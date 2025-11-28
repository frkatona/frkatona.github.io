// function resetZoom() {
//     mainImage.style.objectFit = "contain";
//     mainImage.style.width = "auto";
//     mainImage.style.height = "auto";
//     clearCanvas();
// }


// mainImage.addEventListener('mousedown', function(e) {
//     if (mode === 'box') {
//         isDrawing = true;
//         startX = e.offsetX;
//         startY = e.offsetY;
//         clearCanvas();
//     }
// });

// mainImage.addEventListener('mousemove', function(e) {
//     if (mode === 'box' && isDrawing) {
//         clearCanvas();
//         endX = e.offsetX;
//         endY = e.offsetY;
//         drawRect(startX, startY, endX - startX, endY - startY);
//     }
// });

// mainImage.addEventListener('mouseup', function(e) {
//     if (mode === 'box') {
//         isDrawing = false;
//         applyZoom();
//     }
// });

// function drawRect(x, y, width, height) {
//     ctx.beginPath();
//     ctx.rect(x, y, width, height);
//     ctx.fillStyle = "rgba(0, 150, 255, 0.5)";
//     ctx.fill();
// }

// function clearCanvas() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
// }

// function applyZoom() {
//     const zoomWidth = endX - startX;
//     const zoomHeight = endY - startY;

//     mainImage.style.objectFit = "none";
//     mainImage.style.width = mainImage.naturalWidth + "px";
//     mainImage.style.height = mainImage.naturalHeight + "px";
    
//     const scaleWidth = mainImage.naturalWidth / zoomWidth;
//     const scaleHeight = mainImage.naturalHeight / zoomHeight;

//     const offsetX = startX * (scaleWidth - 1);
//     const offsetY = startY * (scaleHeight - 1);

//     mainImage.style.transformOrigin = "top left";
//     mainImage.style.transform = `scale(${scaleWidth}, ${scaleHeight}) translate(-${offsetX}px, -${offsetY}px)`;

//     clearCanvas();
// }

function displayImages() {
    if (images.length === 0) return;

    // Display image name at the top of the image
    const imageNameDisplay = document.querySelector('.image-name') || document.createElement("div");
    imageNameDisplay.className = 'image-name';
    imageNameDisplay.textContent = imageNames[currentIndex];
    document.querySelector(".gallery").appendChild(imageNameDisplay);

    document.getElementById("mainImage").src = images[currentIndex];
    document.getElementById("mainImage").onclick = recordPosition;

    const thumbnailsContainer = document.querySelector(".thumbnails");
    thumbnailsContainer.innerHTML = ''; // Clear old thumbnails

    images.forEach((image, index) => {
        const img = document.createElement("img");
        img.src = image;
        img.classList.add("thumbnail");
        img.width = 60;
        img.height = 60;
        if (index === currentIndex) {
            img.classList.add("active");
        }
        // img.onclick = function() {
        //     currentIndex = index;
        //     displayImages();
        // };
        thumbnailsContainer.appendChild(img);
    });
}