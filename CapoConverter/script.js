// Same data as in the Python script
var capoPositions = {
    '0': ['A', 'Am', 'C', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G'],
    '1': ['A#', 'A#m', 'C#', 'D#', 'D#m', 'F', 'Fm', 'F#', 'F#m', 'G#'],
    '2': ['B', 'Bm', 'D', 'E', 'Em', 'F#', 'F#m', 'G', 'Gm', 'A'],
    '3': ['C', 'Cm', 'D#', 'F', 'Fm', 'G', 'Gm', 'G#', 'G#m', 'A#'],
    '4': ['C#', 'C#m', 'E', 'F#', 'F#m', 'G#', 'G#m', 'A', 'Am', 'B'],
    '5': ['D', 'Dm', 'F', 'G', 'Gm', 'A', 'Am', 'A#', 'A#m', 'C'],
    '6': ['D#', 'D#m', 'F#', 'G#', 'G#m', 'A#', 'A#m', 'B', 'Bm', 'C#'],
    '7': ['E', 'Em', 'G', 'A', 'Am', 'B', 'Bm', 'C', 'Cm', 'D'],
    '8': ['F', 'Fm', 'G#', 'A#', 'A#m', 'C', 'Cm', 'C#', 'C#m', 'D#'],
    '9': ['F#', 'F#m', 'A', 'B', 'Bm', 'C#', 'C#m', 'D', 'Dm', 'E'],
    '10': ['G', 'Gm', 'A#', 'C', 'Cm', 'D', 'Dm', 'D#', 'D#m', 'F'],
    '11': ['G#', 'G#m', 'B', 'C#', 'C#m', 'D#', 'D#m', 'E', 'Em', 'F#']
};
var keyList = ['A', 'Am', 'A#', 'A#m', 'B', 'Bm', 'C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'D#', 'D#m', 'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'G', 'Gm', 'G#', 'G#m'];

// Define groups for chords
var chordGroups = {
    'A': ['A', 'Am', 'A#', 'A#m'],
    'B': ['B', 'Bm'],
    'C': ['C', 'Cm', 'C#', 'C#m'],
    'D': ['D', 'Dm', 'D#', 'D#m'],
    'E': ['E', 'Em'],
    'F': ['F', 'Fm', 'F#', 'F#m'],
    'G': ['G', 'Gm', 'G#', 'G#m'],
};

// Generate chords in the HTML
var chordContainer = document.getElementById('chordContainer');

for (let group in chordGroups) {
    // Create a div for each chord group
    var groupDiv = document.createElement('div');
    groupDiv.className = 'chord-group';

    // Add a label for the chord group
    var groupLabel = document.createElement('h3');
    // groupLabel.innerText = group;
    groupDiv.appendChild(groupLabel);

    chordGroups[group].forEach(function(chord) {
        var div = document.createElement('div');
        div.className = 'chord';
        div.innerText = chord;
        div.onclick = function() {
            this.classList.toggle('selected');
            getValidPositions();
        };
        groupDiv.appendChild(div);
    });

    chordContainer.appendChild(groupDiv);
}

// Function to get valid capo positions and new shapes
function getValidPositions() {
    var selectedChords = Array.from(document.querySelectorAll('.chord.selected')).map(function(chord) {
        return chord.innerText;
    });

    var output = document.getElementById('output');
    output.innerHTML = ''; // Clear the output area

    for (var position in capoPositions) {
        if (selectedChords.every(chord => capoPositions[position].includes(chord))) {
            var positionOutput = document.createElement('div');
            positionOutput.innerText = 'Capo position: ' + position;
            output.appendChild(positionOutput);

            var newShapeOutput = document.createElement('div');
            selectedChords.forEach(function(chord) {
                var firstPositionIndex = keyList.indexOf(chord);
                var newShape = keyList[(firstPositionIndex - parseInt(position) * 2) % keyList.length];
                newShapeOutput.innerText += chord + ' -> ' + newShape + '\n';
            });

            output.appendChild(newShapeOutput);
        }
    }
}


// Function to get valid capo positions and the new chord shapes for each
function getValidPositions() {
    var selectedChords = Array.from(document.querySelectorAll('.chord.selected')).map(function(chord) {
        return chord.innerText;
    });
    var validPositions = [];
    for (var position in capoPositions) {
        if (selectedChords.every(chord => capoPositions[position].includes(chord))) {
            // Find the new chord shapes for this position
            var newShapes = selectedChords.map(function(chord) {
                var index = keyList.indexOf(chord);
                var newIndex = (index - position * 2 + keyList.length) % keyList.length;
                return keyList[newIndex];
            });
            // Add the position and new shapes to the list
            validPositions.push({
                position: position,
                newShapes: newShapes
            });
        }
    }

    // Display valid capo positions and the new chord shapes
    var output = document.getElementById('output');
    output.innerHTML = validPositions.map(function(position) {
        return 'Capo Position: ' + position.position + '<br>' + position.newShapes.join(', ');
    }).join('<br><br>');

    if (selectedChords.length == 0){
        output.innerHTML = '';
    }
}

// Dark Mode
document.body.classList.add("dark-mode");
const toggle = document.getElementById("dark-mode-toggle");
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}
toggle.addEventListener("change", toggleDarkMode);
