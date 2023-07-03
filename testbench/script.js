fetch('songs.json')
  .then(response => response.json())
  .then(songs => {
    var songSelect = document.getElementById('songSelect');
    songs.forEach((song, i) => {
      var option = document.createElement('option');
      option.value = i;
      option.innerText = song.title;
      songSelect.appendChild(option);
    });

    songSelect.onchange = function() {
      var song = songs[this.value];
      var content = document.getElementById('content');
      
      content.innerHTML = song.sections.map(section =>
        `<div class="section">
          <h3>${section.name}</h3>
          ${Array.isArray(section.lines[0]) // Check if "lines" is an array of arrays
            ? section.lines.map(line => // If yes, map over each line (which is an array)
                `<div class="line">
                  ${line.map(({word, chord}) =>
                    `<div class="word">${chord ? `<span class="chord">${chord}</span>` : ''}${word}</div>`
                  ).join('')}
                </div>`
              ).join('')
            : `<div class="line">
                ${section.lines.map(({word, chord}) =>
                  `<div class="word">${chord ? `<span class="chord">${chord}</span>` : ''}${word}</div>`
                ).join('')}
              </div>`
          }
        </div>`
      ).join('');
    };

    songSelect.value = 0;
    songSelect.onchange();

    
  });


var scrollButton = document.getElementById('scrollButton');
var scrolling = false;
var speed = 1; // Adjust the scrolling speed here
var bpmDisplay = document.getElementById('bpm');
var metronome = document.getElementById('metronome');
var taps = [];
var timeout;
var bpm = 60;
var beat = 0;
var flashing = false;
var scrollButton = document.getElementById('scrollButton');
var cooldownProgress = document.getElementById('cooldownProgress');


metronome.onclick = function() {
    if (taps.length === 0) {
      cooldownProgress.style.borderColor = 'transparent';
    }
  
    if (taps.length < 4) {
      var now = new Date().getTime();
      taps.push(now);
  
      if (taps.length === 4) {
        // Metronome flashes red on each tap
        metronome.style.backgroundColor = 'red';
        cooldownProgress.style.borderColor = 'red';
  
        // Calculate average interval
        var intervals = [];
        for (var i = 0; i < taps.length - 1; i++) {
          intervals.push(taps[i + 1] - taps[i]);
        }
        var averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        bpm = Math.round(60000 / averageInterval);
        bpmDisplay.innerText = bpm;
        speed = bpm / 60; // the scroll speed is adjusted to the bpm
  
        beat = 0;
        clearInterval(interval);
        interval = setInterval(flashMetronome, 60000 / bpm);
  
        // Start 2 second timer to reset the tap counter, timer and restore the regular flashing
        timeout = setTimeout(function() {
          taps = [];
          flashing = false;
          cooldownProgress.style.borderColor = 'transparent';
        }, 2000);
      }
    }
  };
// Metronome functionality
metronome.onclick = function() {
  clearTimeout(timeout);
  flashing = true;
  var now = new Date().getTime();
  taps.push(now);

  if (taps.length > 4) {
    taps = taps.slice(-4); // keep only the last 4 taps
    var intervals = [];
    for (var i = 0; i < taps.length - 1; i++) {
      intervals.push(taps[i + 1] - taps[i]);
    }
    var averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    bpm = Math.round(60000 / averageInterval);
    bpmDisplay.innerText = bpm;
    speed = bpm / 60; // the scroll speed is adjusted to the bpm

    beat = 0;
    clearInterval(interval);
    interval = setInterval(flashMetronome, 60000 / bpm);
  }

  // Metronome flashes red on each tap
  metronome.style.backgroundColor = 'red';
  setTimeout(function() {
    metronome.style.backgroundColor = '#f5f5f5';
  }, 200);

  // Start 2 second timer to reset the tap counter, timer and restore the regular flashing
  timeout = setTimeout(function() {
    taps = [];
    flashing = false;
  }, 2000);
};

// Metronome flashes green (or blue every fourth flash) at the set tempo
var interval = setInterval(flashMetronome, 60000 / bpm);

function flashMetronome() {
  if (!flashing) {
    beat = (beat + 1) % 4;
    metronome.style.backgroundColor = (beat === 0) ? 'blue' : 'green';
    setTimeout(function() {
      metronome.style.backgroundColor = '#f5f5f5';
    }, 200);
  }
}

scrollButton.onclick = function() {
    scrolling = !scrolling;
    scrollButton.innerText = scrolling ? 'Stop Scrolling' : 'Start Scrolling';
  
    if (scrolling) {
      var scrollInterval = setInterval(function() {
        if (!scrolling) {
          clearInterval(scrollInterval);
        } else {
          window.scrollBy(0, speed);
        }
      }, 100); // converting to ms to fit in a frame per second context
    }
  };
  