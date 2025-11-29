let vibrationInterval;
let lastVibrationTime = 0;
let vibrationCount = 0;
const MAX_VIBRATIONS = 10000; // Set the maximum number of vibrations

// Stops vibration
function stopVibrate() {
    navigator.vibrate(0);
    clearInterval(vibrationInterval);
    lastVibrationTime = 0;
    vibrationCount = 0;
}

// Vibrates once, duration determined by user.
function singleVibrate() {
    let duration = document.getElementById("viblen").value;
    // Validate user input (for numbers)
    if (duration.match(/^\d+$/)) {
        navigator.vibrate(duration);
        console.log(`Vibration 1: ${duration}ms`);
    } else {
        document.getElementById("results").innerText = "Error, please input a number for Vibration Duration.";
    }
}

// Start persistent vibration at given duration and interval
// Assumes a number value is given
function multipleVibrate() {
    let duration = document.getElementById("viblen").value;
    let bpm = document.getElementById("tempo").value;

    if ((!duration.match(/^\d+$/)) || (!bpm.match(/^\d+$/))) {
        document.getElementById("results").innerText = "Error, please input a number in all fields.";
    } else {
        let pauseLength = (60 / bpm) * 1000 - parseInt(duration); // Convert BPM to milliseconds and subtract duration
        vibrationInterval = setInterval(() => {
            if (vibrationCount >= MAX_VIBRATIONS) {
                stopVibrate();
                document.getElementById("results").innerText = "Maximum number of vibrations reached.";
                return;
            }
            let currentTime = Date.now();
            let timeSinceLastVibration = currentTime - lastVibrationTime;
            vibrationCount++;
            navigator.vibrate(duration);
            console.log(`Vibration ${vibrationCount}: ${duration}ms, ${timeSinceLastVibration}ms since last vibration`);
            lastVibrationTime = currentTime;
        }, pauseLength + parseInt(duration));
    }
}