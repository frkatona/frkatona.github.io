// Define the animation durations based on the rhythm divisions
let sixteenthNoteDuration = 250; // 60 seconds / 240 bpm
let eighthNoteDuration = 500; // 60 seconds / 120 bpm
let quarterNoteDuration = 1000; // 60 seconds / 60 bpm
let wholeNoteDuration = 4000; // 60 seconds / 15 bpm

// Animate each dot
animateDot('sixteenth', sixteenthNoteDuration);
animateDot('eighth', eighthNoteDuration);
animateDot('quarter', quarterNoteDuration);
animateDot('whole', wholeNoteDuration);

function animateDot(id, duration) {
    let dot = document.getElementById(id);

    dot.animate([
        { transform: 'rotate(0deg) translateX(125px) rotate(0deg)' },
        { transform: 'rotate(360deg) translateX(125px) rotate(-360deg)' }
    ], {
        duration: duration,
        iterations: Infinity
    });
}
