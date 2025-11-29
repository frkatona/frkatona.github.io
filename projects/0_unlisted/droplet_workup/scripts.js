let images = [];
let imageNames = [];
let currentIndex = 0;
let mode = "point";  // default mode
let isDrawing = false;
let startX, startY, endX, endY;
const canvas = document.getElementById('selectionCanvas');
const ctx = canvas.getContext('2d');
const mainImage = document.getElementById("mainImage");

function setMode(newMode) {
    mode = newMode;
}

mainImage.onload = function() {
    canvas.width = mainImage.width;
    canvas.height = mainImage.height;
}

function loadImages(event) {
    const files = event.target.files;
    images = [];
    imageNames = [];
    currentIndex = 0;

    for (let i = 0; i < files.length; i++) {
        imageNames.push(files[i].name); // Storing image names

        const reader = new FileReader();
        reader.onload = function(e) {
            images.push(e.target.result);
            if (images.length === files.length) {
                populateTable(); // Separate table population
                displayImages();
            }
        };
        reader.readAsDataURL(files[i]);
    }
}

function populateTable() {
    const tableBody = document.querySelector("#positionsTable tbody");
    tableBody.innerHTML = ''; // Clear old table rows

    images.forEach((image, index) => {
        const tr = document.createElement("tr");
        const tdImage = document.createElement("td");
        tdImage.textContent = `${index + 1}`;
        const tdPositions = document.createElement("td");
        tdPositions.textContent = "click start";
        tdPositions.id = `positions-${index}`;
        tr.appendChild(tdImage);
        tr.appendChild(tdPositions);
        tableBody.appendChild(tr);
    });
}

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
        thumbnailsContainer.appendChild(img);
    });
}


function fitEllipse(points) {
    // points is an array of [x, y] pairs
    if (points.length < 6) {
        throw new Error('At least 6 points are required to fit an ellipse');
    }

    // Build the overdetermined system of equations
    const A_matrix = points.map(([x, y]) => [x*x, x*y, y*y, x, y, 1]);
    const b_matrix = new Array(points.length).fill(0);

    // Solve the system using least squares method
    const result = math.lusolve(A_matrix, b);

    // Extract ellipse parameters from the result
    const [A, B, C, D, E, F] = result;

    // Calculate the center of the ellipse
    const cx = (2*C*D - B*E) / (B*B - 4*A*C);
    const cy = (2*A*E - B*D) / (B*B - 4*A*C);

    // Calculate the semi-major and semi-minor axes
    const term = Math.sqrt((A-C)*(A-C) + B*B);
    const a = Math.sqrt(2 * (A*E*E + C*D*D + F*B*B - 2*B*D*E - A*C*F) / ((B*B - 4*A*C) * (term - (A+C))));
    const b = Math.sqrt(2 * (A*E*E + C*D*D + F*B*B - 2*B*D*E - A*C*F) / ((B*B - 4*A*C) * (-term - (A+C))));

    return {a, b_matrix, cx, cy};
}

function drawEllipse(ctx, cx, cy, a, b) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
    console.log(`Ellipse: cx=${cx}, cy=${cy}, a=${a}, b=${b}`);
}

function recordPosition(event) {
    if (mode !== 'point') return;

    const positionsCell = document.getElementById(`positions-${currentIndex}`);
    const positions = positionsCell.textContent.split(', ');

    if (event.ctrlKey) {
        // ctrl + LC => remove the last position
        if (positions.length > 1) {
            positions.pop();
            positions.pop();
            positionsCell.textContent = positions.join(', ');
        }
    } else {
        // LC => add a new position
        const x = event.offsetX;
        const y = event.offsetY;
        positions.push(`(${x}, ${y})`);
        positionsCell.textContent = positions.join(', ');

        // and add a red dot
        const dotSize = 10;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();

        console.log(positions.length)
        if (positions.length >= 10) {
            // fit an ellipse to the points
            const [x1, y1, x2, y2, x3, y3] = positions.map(pos => pos.match(/\d+/g));
            const {a, b, cx, cy} = fitEllipse(x1, y1, x2, y2, x3, y3);
            drawEllipse(ctx, cx, cy, a, b);
        }
    }
}