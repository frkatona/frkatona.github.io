window.onload = function() {
    document.getElementById('welcome-overlay').style.display = "block";
}

document.getElementById('welcome-overlay').onclick = function() {
    this.style.display = 'none';
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}


document.addEventListener('keydown', function(event) {
    if (event.key === 'x') {
        toggleRandomNext()
    } else if (event.key === 'c') {
        copyToClipboard()
    } else if (event.key === 'Escape') {
        if (keyboardContainer = document.querySelector('.keyboardContainer')) {
            keyboardContainer.remove();
        }
    } else if (event.key === 'q') {
        document.getElementById('welcome-overlay').style.display = "block";
    } else if (event.key === 'z') {
        toggleMenu()
    } else if (event.key === 'ArrowUp') {
        octaveSelect++;
    } else if (event.key === 'ArrowDown') {
        octaveSelect--;
    } else if (event.key === 'ArrowLeft') {
        leftArrow.click();
    } else if (event.key === 'ArrowRight') {
        rightArrow.click();
    } else if (event.key === '1') {
        document.getElementById('box1').click();
    } else if (event.key === '2') {
        document.getElementById('box2').click();
    } else if (event.key === '3') {
        document.getElementById('box3').click();
    } else if (event.key === '4') {
        document.getElementById('box4').click();
    }
});

const handlers = {
    'key': (value) => key = parseInt(value),
    'volume': (value) => volume = parseFloat(value),
    'octaveSelect': (value) => octaveSelect = parseInt(value),
    'waveShape': (value) => waveShape = value,
    'voiceLeading': (value) => voiceLeading = parseInt(value),
    'openness': (value) => openness = parseInt(value),
    'lowpassCutoff': (value) => lowpassCutoff = parseInt(value),
    'chordColor': (value) => chordColor = parseInt(value)
};

document.getElementById('parameters').addEventListener('change', function(e) {
    const handler = handlers[e.target.id];
    if (handler) {
        handler(e.target.value);
    }
});

function midiNoteToFrequency(midiNote) {
    const A4 = 440;
    return A4 * Math.pow(2, (midiNote - 69) / 12);
}

function AudioHandle(chordNotes){
    for (var i = 0; i < chordNotes.length; i++) {
        // Create an oscillator for each note
        let oscillator = audioContext.createOscillator();
        let gainNode = audioContext.createGain();
        let filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = lowpassCutoff;  
        oscillator.type = waveShape; 
        var now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attack); // Attack
        // gainNode.gain.linearRampToValueAtTime(0.5, now + 0.2); // Decay
        // gainNode.gain.setValueAtTime(0.5, now + 0.7); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, now + 1); // Release
        oscillator.frequency.value = midiNoteToFrequency(chordNotes[i]);
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1);
    }
}

function copyToClipboard() {
    navigator.clipboard.writeText(clipboardText)
        .then(() => {
        console.log('Text copied to clipboard');
        })
        .catch(err => {
        console.error('Error in copying text: ', err);
    });
    var button = document.getElementById('exportMIDI');
    button.innerHTML = 'Copied to clipboard!'; 
    setTimeout(function() {
        button.innerHTML = 'Copy MIDI' ;
    }, 1000);
}

function toggleMenu() {
    var menu = document.getElementById('parameters');
    if (menu.style.display !== 'block') {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

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

var linkColors = ["#ff4a4a", "#6fc66c", "#78b0ff"];
var svg = d3.select("body").append("svg")
.attr("width", window.innerWidth)
.attr("height", window.innerHeight);

var functionColors = ["#04395e", "#70a288", "#c44900"]; // tonic blue; pre-dom green; dom orange
var color = d3.scaleOrdinal(functionColors);

var simulation = d3.forceSimulation()
.force("link", d3.forceLink().id(function(d) { return d.id; })
    .distance(500)  // Set the link distance
    .strength(0.05))  // Set the link strength
.force("charge", d3.forceManyBody()
    .strength(-250)  // Make nodes repel each other more strongly
    .distanceMin(1)  // Avoid instability for very close nodes
    .distanceMax(100)  // Ignore nodes that are very far away
    .theta(.5))  // Make the simulation run faster but less accurately
.force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2.5));
    
d3.json("chord-flow-D3.json", function(error, graph) {
    if (error) {
        console.error("Error loading file:", error);  // Log the error to the console
        return;
    }

var linkColor = d3.scaleOrdinal()
    .domain(["tense", "static", "dynamic"])  // Add all possible types here
    .range([linkColors[0], linkColors[1], linkColors[2]]);  // Add the corresponding colors here

svg.append("defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
    .enter().append("marker")    // This section adds in the arrows
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

var link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
    .attr("id", function(d) { return "link-" + d.id; })  // Assign an ID to each link
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
    .attr("stroke", function(d) { return linkColor(d.type); })
    .attr("marker-end", "url(#end)");

var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("r", 50)
    .attr("fill", function(d) { return color(d.group); })
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

var labels = svg.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(graph.nodes)
    .enter().append("text")
    .attr("class", "unselectable")
    .text(function(d) { return d.id; })
    .style("text-anchor", "middle")
    .style("fill", "#000")
    .style("font-family", "Arial")
    .style("font-size", 30)
    .call(d3.drag()  // Add the same drag handlers to the labels
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

function TriggerNodeLinkVisuals(d) {
    d3.select(node._groups[0][d.index])
    .transition()
    .duration(attack * 1000)
    .attr("r", 100)
    .style("fill", "#511")
    .transition()  // Add another transition
    .duration(attack * 20000)
    .attr("r", 50)  // Reset the radius
    .style("fill", function(d) { return color(d.group); });  // Reset the color

    // Find the links connected to the node as a source
    let linksFrom = graph.links.filter(function(link) {
        return link.source === d;
    });
    
    // Create a transition for each link
    linksFrom.forEach(function(link) {
        d3.select("#link-" + link.id)
            .transition()
            .duration(attack * 2000)
            .style("stroke", function(d) { return linkColor(d.type); })  // Change the color
            .attr("stroke-width", 8)  // Increase the stroke width
            .transition()  // Add another transition
            .duration(1000)  // Set the duration for the second transition
            .style("stroke", function(d) { return linkColor(d.type); })  // Reset the color
            .attr("stroke-width", function(d) { return Math.sqrt(d.value); });  // Reset the stroke width
    });

    // pick a random node that is connected to the node as a target
    let linksTo = graph.links.filter(function(link) {
        return link.source === d;
    });
    let randomLink = linksTo[Math.floor(Math.random() * linksTo.length)];
    let randomNode = randomLink.target;
    
    if (repeatTest == true && repeatCounter < chordBars - 1) {
        setTimeout(function() { HandleNodeClick(randomNode); }, randomDelay);
        repeatCounter++;
    } else {
        // repeatTest = false;
        repeatCounter = 0;
        // document.getElementById("randomNext").style.backgroundColor = "#666666";

    }
}

function PushChordBoxStack(chordName, color, chordNotes) {
    // If there are already four chords, remove the first one
    if (lastFourChordNames.length === 4) {
        lastFourChordNames.shift();
        lastFourChordNotes.shift();
    }

    // Add the new chord and its color
    lastFourChordNames.push({ identity: chordName, color: color });
    lastFourChordNotes.push({ identity: chordNotes});

    // Update the boxes
    for (var i = 0; i < lastFourChordNames.length; i++) {
        var box = document.getElementById('box' + (i + 1));
        box.textContent = lastFourChordNames[i].identity;
        box.style.backgroundColor = lastFourChordNames[i].color;
    }

    // Update the clipboard-copyable text with chordNotes
    clipboardText = lastFourChordNotes.map(function(chord) {
        return chord.identity;
    }).join(' ');

    // PLACEHOLDER - add an animation to the box most recently changed (will be box4 except for first 3 clicks)
}

function neighbor(chordNotes1, chordNotes2) {
    let neighborDistances_2D = [];
    let goUp = chordNotes1[0] > chordNotes2[0];

    for (let i = 0; i < chordNotes2.length; i++) {
        let distances_1D = chordNotes1.map(value => value - chordNotes2[i]);
        neighborDistances_2D.push(distances_1D);
    }
    return neighborDistances_2D;
}

function VoiceLeadChord(firstChord, secondChord, voiceLeading) {
    neighborDistances_2D = neighbor(lastFourChordNotes[lastFourChordNotes.length - 1].identity, chordNotes);
    console.log("last chord: " + firstChord);
    console.log("this chord (pre-VL): " + secondChord);
    console.log("neighborDistances_2D: ");
    console.log(neighborDistances_2D);
    
    let voiceLedChord = [];

    // iterate through each column of the neighborDistance 2D array
    for (let j = 0; j < neighborDistances_2D.length; j++) {
        let minInterval = 1000;
        let minIndex = 0;
        let maxInterval = 0;
        let sumIntervals = 0;
        // iterate through each row of the neighborDistance 2D array
        for (let i = 0; i < neighborDistances_2D[j].length; i++) {
            // if the value is less than the current min, update the min and minIndex
            if (Math.abs(neighborDistances_2D[j][i]) < Math.abs(minInterval)) {
                minInterval = neighborDistances_2D[j][i];
                minIndex = i;
            }
            // // if the value is greater than the current max, update the max
            // if (Math.abs(neighborDistances_2D[j][i]) > maxInterval) {
            //     maxInterval = Math.abs(neighborDistances_2D[j][i]);
            // }
            // sumIntervals += Math.abs(neighborDistances_2D[j][i]);
        }

        console.log("j="+j+" minInterval: " + minInterval);
        // let i_avg = sumIntervals / neighborDistances_2D[j].length; // measure of openness
        // console.log("j="+j+" maxInterval: " + maxInterval);
        // console.log("j="+j+" avgInterval: " + i_avg);
        
        // push the value as-is
        voiceLedChord.push(secondChord[j])

        // if the smallest inter-chord interval found that index is sufficiently large, move the it an octave towards the smallest interval 
        // (but maybe I should do towards the biggest?)
        if (Math.abs(minInterval) > voiceLeading) {
            let direction = minInterval > 0 ? 1 : -1;
            voiceLedChord[j] += 12 * direction;
            console.log('-----------------> minInterval = ' + minInterval + ' so moving note ' + direction + ' octave');
        } 
    }

    // (PLACEHOLDER) open the chord back up if it's too closed 
    // (first tinker with monitoring the intervals between the notes in the chord and the root)
    for (let i = 1; i < voiceLedChord.length; i++) {
        console.log("inter-chord interval " + i + ": " + (voiceLedChord[i] - voiceLedChord[i-1]));
    }
    
    // force it back to preferred octave if it strayed
    // maybe just do this while I'm moving the notes earlier
    let min = Math.min(...voiceLedChord);
    let max = Math.max(...voiceLedChord);
    if (min < (octaveSelect) * 12) {
        for (let i = 0; i < voiceLedChord.length; i++) {
            voiceLedChord[i] += 12;
        }
    } else if (max > (octaveSelect+3) * 12) {
        for (let i = 0; i < voiceLedChord.length; i++) {
            voiceLedChord[i] -= 12;
        }
    }

    console.log("this chord (post-VL): " + voiceLedChord);

    sortedChord = voiceLedChord.sort(function(a, b) {
        return a - b;
    });

    // Log the average distance of values in the sorted voiceLedChord array
    let sum = 0;
    for (let i = 1; i < sortedChord.length; i++) {
        sum += Math.abs(sortedChord[i] - sortedChord[i-1]);
    }
    let avg = sum / sortedChord.length;

    console.log("sorted voiceLedChord: " + sortedChord)
    console.log("avg intra-chord intervals: " + avg);

    return voiceLedChord;
}

function ConstructBaseChord(d, key, chordColor) {
    let chordTonality;
    if (d.notes[1] - d.notes[0] == 3){
        if (d.notes[2] - d.notes[1] == 4){
            chordTonality = "min";
        } else if (d.notes[2] - d.notes[1] == 3){
            chordTonality = "dim";
        }
    } else if (d.notes[3] - d.notes[0] == 11) {
        chordTonality = "maj";
    } else {
        chordTonality = "" //dominant
    }

    chordNotes = d.notes.map(note => note + key + ((octaveSelect+1) * 12));
    chordName = keyArray[(d.notes[0] + key + 12) % 12] + chordTonality + extensions[chordColor];

    // extensions (chordColor value is movement from the 7 except for 1 which is no extension which takes the root up an octave)
    if (chordColor == 1) {
        chordNotes[3] = chordNotes[0] + 12;
    } else {
        if (chordColor > 1) {
            chordNotes[3] = chordNotes[0] + 12 + chordColor;
        }
    }

    return [chordTonality, chordNotes, chordName];
}

function DebugConsoleLog(d, key, chordTonality, chordColor) {
    console.log("<-----------NEW CHORD----------->");
    console.log("d.notes[0]: " + d.notes[0]);
    console.log("key: " + key);
    console.log("keyArray.length: " + keyArray.length);
    console.log(keyArray.length % (d.notes[0] + key));
    console.log(chordName);
    console.log("key: " + keyArray[key]);
    console.log("chord root: "+ keyArray[d.notes[0] + key]);
    console.log("chord tonality: " + chordTonality);
    console.log("chord color: " + extensions[chordColor]);
}


function ModifyBaseChord(chordNotes, chordColor, chordTonality, voiceLeading, openness, butter) {
    // (PLACEHOLDER) butter
    // remove the third index from the array
    // if (butter == 0) {
    //     array.splice(2, 1)
    // }

    // voice leading
    if (voiceLeading < 12 && lastFourChordNotes.length > 0) {
        chordNotes = VoiceLeadChord(lastFourChordNotes[lastFourChordNotes.length - 1].identity, chordNotes, voiceLeading);
    }

    // (PLACEHOLDER) voice openness
    // "open both inter-chord intervals back up" strategy won't work unless I can retroactively change the first
    // can just permanently make sure at least one of the middle intervals goes up an octave before it checks for voice leading...or after?

    return chordNotes;
}

function HandleNodeClick(d) { 
    if (keyboardContainer = document.querySelector('.keyboardContainer')) {
        keyboardContainer.remove();
    }
    if (document.querySelector('.controls')) {
        document.querySelector('.controls').remove();
    }
    let [chordTonality, chordNotes, chordName] = ConstructBaseChord(d, key, chordColor);
    chordNotes = ModifyBaseChord(chordNotes, chordColor, chordTonality, voiceLeading, openness, butter);
    DebugConsoleLog(d, key, chordTonality, chordColor);
    AudioHandle(chordNotes);
    PushChordBoxStack(chordName, color(d.group), chordNotes);
    TriggerNodeLinkVisuals(d);
};

// handle chord box clicking
d3.selectAll("#box1, #box2, #box3, #box4").on("click", function() {
    console.log(this.id + " clicked");
    console.log(this.textContent);
    console.log(lastFourChordNotes[this.id[this.id.length - 1] - 1].identity);
    AudioHandle(lastFourChordNotes[this.id[this.id.length - 1] - 1].identity);
    
// Trigger box visuals
d3.select(this)
    .transition()
    .duration(attack * 1000)
    .style("background-color", "#511")
    .transition()
    .duration(attack * 20000)
    .style("background-color", lastFourChordNames[this.id[this.id.length - 1] - 1].color);
    CreateKeyboardGUI(lastFourChordNotes[this.id[this.id.length - 1] - 1].identity, this.id);
});

node.on("click", HandleNodeClick);
labels.on("click", HandleNodeClick);

simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

simulation.force("link")
    .links(graph.links);

function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    labels
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y + 7; });
    }
});

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// Keyboard GUI
function CreateKeyboardGUI(chordNotes_real, boxID) {
    if (document.querySelector('.keyboardContainer')) {
        document.querySelector('.keyboardContainer').remove();
    }

    if (document.querySelector('.controls')) {
        document.querySelector('.controls').remove();
    }

    const keyboardLength = 48;
    const keyboardContainer = document.createElement('keyboardContainer');
    let octaveChange = 0;

    keyboardContainer.classList.add('keyboardContainer');
    document.body.appendChild(keyboardContainer);

    // keep subtracting 12 from each element of colored keys until the lowest is less than 12
    chordNotes_colored = chordNotes_real.map(value => value + 1);
    while (Math.min(...chordNotes_colored) > 24) {
        console.log("chordNotes_colored: " + chordNotes_colored);
        chordNotes_colored = chordNotes_colored.map(value => value - 12);
        octaveChange += 1;
    }

    console.log("chordNotes_colored: " + chordNotes_colored);

    // Function to create a key
    function createKey(color, index) {
        const key = document.createElement('div');
        key.classList.add('key', color);
        if (chordNotes_colored.includes(index)) {
            key.classList.add('chordkey');
        }
    
        key.addEventListener('click', () => {
            // Remove the 'active' class from the previously active key, if there is one
            const activeKey = document.querySelector('.chordkey.active');
            if (activeKey) {
                activeKey.classList.remove('active');
            }
    
            // Remove existing controls, if there are any
            const existingControls = document.querySelector('.controls');
            if (existingControls) {
                existingControls.remove();
            }
    
            // Add the 'active' class to the clicked key
            key.classList.add('active');
    
            // Create and add the controls
            if (chordNotes_colored.includes(index)){
                const controls = createControls(index);
                document.body.appendChild(controls);
            }
    
            console.log(`Key ${index} was clicked`);
        });
    
        return key;
    }
    
    function createControls(index) {
        const controls = document.createElement('div');
        controls.classList.add('controls');
    
        const xButton = document.createElement('button');
        xButton.textContent = 'x';
        xButton.classList.add('x-button');
        xButton.addEventListener('click', () => {
            console.log(`X button for key ${index} was clicked`);
            keyboardContainer.remove();
            document.querySelector('.controls').remove();
        });

        function handleArrowClick(index, direction) {
            console.log(`Arrow for key ${index} was clicked`);

            const activeKeyIndex = chordNotes_colored.indexOf(index);
            let newPosition = index + 12 * direction;

            if (newPosition < keyboardLength && newPosition > 0) {
                chordNotes_colored[activeKeyIndex] += 12 * direction;
                chordNotes_real[activeKeyIndex] += 12 * direction;
                const key = document.querySelector(`.key:nth-child(${index})`);
                const newKey = document.querySelector(`.key:nth-child(${newPosition})`);
                key.classList.remove('chordkey');
                key.classList.remove('active');
                newKey.classList.add('chordkey');
                newKey.classList.add('active');
        
                // update the controls position
                newKey.click();

                lastFourChordNotes[boxID[boxID.length - 1] - 1].identity = chordNotes_real;
                console.log("lastFourChordNotes " + lastFourChordNotes[boxID[boxID.length - 1] - 1].identity);
                AudioHandle(lastFourChordNotes[boxID[boxID.length - 1] - 1].identity);
                clipboardText = lastFourChordNotes.map(function(chord) {
                    return chord.identity;
                }).join(' ');

            } else { 
                console.log("can't go that way");
            }
        }
        
        const leftArrow = document.createElement('button');
        leftArrow.textContent = '<';
        leftArrow.classList.add('leftarrow');
        leftArrow.addEventListener('click', () => handleArrowClick(index, -1));
        
        const rightArrow = document.createElement('button');
        rightArrow.textContent = '>';
        rightArrow.classList.add('rightarrow');
        rightArrow.addEventListener('click', () => handleArrowClick(index, 1));
    
        controls.appendChild(leftArrow);
        controls.appendChild(xButton);
        controls.appendChild(rightArrow);
    
        // Position the controls under the key
        const key = document.querySelector(`.key:nth-child(${index + 1})`);
        const keyRect = key.getBoundingClientRect();
    
        return controls;
    }
    
    // Add keys to the piano
    for (let i = 1; i <= keyboardLength; i++) {
        let keyColor = 'white';
        if ([2, 4, 7, 9, 11, 14, 16, 19, 21, 23, 26, 28, 31, 33, 35, 38, 40, 43, 45, 47, 50, 52, 55, 57, 59, 62].includes(i)) {
            keyColor = 'black';
        }
        keyboardContainer.appendChild(createKey(keyColor, i));
    }
};
