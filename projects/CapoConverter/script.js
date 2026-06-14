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

function getChordAccent(chord) {
    var chordIndex = keyList.indexOf(chord);
    var hue = Math.round(((chordIndex >= 0 ? chordIndex : 0) * 137.508 + 190) % 360);

    return {
        color: 'hsl(' + hue + ', 84%, 64%)',
        glow: 'hsla(' + hue + ', 84%, 64%, 0.42)'
    };
}

function setChordAccent(element, chord) {
    var accent = getChordAccent(chord);
    element.style.setProperty('--chord-color', accent.color);
    element.style.setProperty('--chord-glow', accent.glow);
}

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
        div.dataset.chord = chord;
        div.onclick = function() {
            this.classList.toggle('selected');
            getValidPositions();
        };
        groupDiv.appendChild(div);
    });

    chordContainer.appendChild(groupDiv);
}

// Function to get valid capo positions and the new chord shapes for each
function getValidPositions() {
    var selectedChordElements = Array.from(document.querySelectorAll('.chord.selected'));
    var selectedChords = selectedChordElements.map(function(chord) {
        return chord.dataset.chord;
    });
    var output = document.getElementById('output');

    document.querySelectorAll('.chord').forEach(function(chord) {
        chord.style.removeProperty('--chord-color');
        chord.style.removeProperty('--chord-glow');
    });

    selectedChordElements.forEach(function(chord) {
        setChordAccent(chord, chord.dataset.chord);
    });

    if (selectedChords.length == 0) {
        output.innerHTML = '';
        return;
    }

    var validPositions = [];
    for (var position in capoPositions) {
        if (selectedChords.every(chord => capoPositions[position].includes(chord))) {
            // Find the new chord shapes for this position
            var chordMappings = selectedChords.map(function(chord) {
                var keyIndex = keyList.indexOf(chord);
                var newIndex = (keyIndex - position * 2 + keyList.length) % keyList.length;
                var accent = getChordAccent(chord);
                return {
                    original: chord,
                    shape: keyList[newIndex],
                    color: accent.color
                };
            });
            // Add the position and new shapes to the list
            validPositions.push({
                position: position,
                chordMappings: chordMappings
            });
        }
    }

    // Display valid capo positions and the new chord shapes
    output.innerHTML = '';

    validPositions.forEach(function(position) {
        var positionCard = document.createElement('div');
        positionCard.className = 'capo-position';

        var heading = document.createElement('h3');
        heading.innerText = 'Capo Position: ' + position.position;
        positionCard.appendChild(heading);

        position.chordMappings.forEach(function(mapping) {
            var row = document.createElement('div');
            row.className = 'chord-mapping';
            row.style.setProperty('--chord-color', mapping.color);

            var originalChord = document.createElement('span');
            originalChord.className = 'mapped-chord original-chord';
            originalChord.innerText = mapping.original;

            var arrow = document.createElement('span');
            arrow.className = 'mapping-arrow';
            arrow.innerText = '->';

            var newChord = document.createElement('span');
            newChord.className = 'mapped-chord new-chord';
            newChord.innerText = mapping.shape;

            row.appendChild(originalChord);
            row.appendChild(arrow);
            row.appendChild(newChord);
            positionCard.appendChild(row);
        });

        output.appendChild(positionCard);
    });

    if (validPositions.length == 0) {
        var emptyState = document.createElement('div');
        emptyState.className = 'output-empty-state';
        emptyState.innerText = 'no valid capo positions found for current selection';
        output.appendChild(emptyState);
    }
}

// Dark Mode
document.body.classList.add("dark-mode");
const toggle = document.getElementById("dark-mode-toggle");
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}
toggle.addEventListener("change", toggleDarkMode);
