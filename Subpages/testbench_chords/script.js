// script.js
document.getElementById('addChordsBtn').addEventListener('click', function() {
    var lyrics = document.getElementById('lyricsInput').value;
    var output = document.getElementById('output');
    output.innerHTML = ''; // Clear previous output

    // This is a placeholder for where you'd process the lyrics and chords.
    // For demonstration, we're just going to split by spaces and randomly assign chords
    // Ideally, you'd have a more sophisticated method of assigning chords to syllables
    var words = lyrics.split(' ');
    var htmlContent = '';
    words.forEach(word => {
        var chord = '<span class="chord">G</span>'; // Example, you would dynamically generate or choose chords
        var lyric = `<span class="lyric">${word}</span>`;
        htmlContent += `${chord} ${lyric} `;
    });

    output.innerHTML = htmlContent;
});
