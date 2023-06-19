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

// Generate chords in the HTML
var chordContainer = document.getElementById('chordContainer');
keyList.forEach(function(chord) {
    var div = document.createElement('div');
    div.className = 'chord';
    div.innerText = chord;
    div.onclick = function() {
        this.classList.toggle('selected');
        getValidPositions();
    };
    chordContainer.appendChild(div);
});

// Function to get valid capo positions
function getValidPositions() {
    var selectedChords = Array.from(document.querySelectorAll('.chord.selected')).map(function(chord) {
        return chord.innerText;
    });
    var validPositions = [];
    for (var position in capoPositions) {
        if (selectedChords.every(chord => capoPositions[position].includes(chord))) {
            validPositions.push(position);
        }
    }

    // Display valid capo positions
    var output = document.getElementById('output');
    output.innerText = validPositions.join(', ');
}