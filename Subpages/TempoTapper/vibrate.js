let vibrationInterval;

// Stops vibration
function stopVibrate() {
    navigator.vibrate(0);
    clearInterval(vibrationInterval);
}

// Vibrates once, duration determined by user.
function singleVibrate() {
    let duration = document.getElementById("viblen").value;
    // Validate user input (for numbers)
    if (duration.match(/^\d+$/)) {
        navigator.vibrate(duration);
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
        let pauseLength = (60 / bpm) * 1000; // Convert BPM to milliseconds
        vibrationInterval = setInterval(() => {
            navigator.vibrate(duration);
        }, pauseLength + parseInt(duration));
    }
}
