// Global Constants
        //twelth root of two
        const twelthRoot = 1.0594630943592952645618252949463;
        const keyArray = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A","A#", "B"];
        const extensions = {
                0: "7",
                1: "",
                2: " add9",
                4: " add11"
            }
        let repeatTest = false;
        let repeatCounter = 0;
        let clipboardText = "no chords played yet"
        
        // User parameters (audio)
        let key = 0;
        let volume = 0.2;
        let octaveSelect = 4;
        let attack = 0.1;
        let waveShape = "triangle";
        let lowpassCutoff = 4000;
        let randomDelay = 1000;

        // User parameters (UI) [placeholder]
        let chordBars = 4; // use this to construct more boxes as a user UI control later

        // User parameters (chord quality)
        let openness = 3;
        let voiceLeading = 3; // smallest allowed nearest inter-chord neighbor interval
        let butter = 0;
        let chordColor = 0;
        let lastNode = d3.select("#I");

        //random next toggle function
        function toggleRandomNext() {
            var button = document.getElementById("randomNext");
            if (repeatTest == false) {
                repeatTest = true;
                button.style.backgroundColor = "green";
                button.innerText = "Click Any Chord";
            } else {
                repeatTest = false;
                button.style.backgroundColor = "#666666";
                button.innerText = "Random Next";
            }
        }