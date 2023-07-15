fetch('utilities/lyrics_library.json')

.then(response => response.json())
  .then(songs => {
    var songList = document.getElementById('songList');
    songs.forEach((song, i) => {
      var li = document.createElement('li');
      li.innerText = song.title;
      li.onclick = function() {
        loadSong(song);
        document.getElementById('panel').style.display = 'none';
      };
      songList.appendChild(li);
    });

    loadSong(songs[0]);

    document.getElementById('hamburger').onclick = function() {
      var panel = document.getElementById('panel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
  });

function loadSong(song) {
  window.scrollTo(0, 0);
  var content = document.getElementById('content');
    var songInfo = `
    <div class="song-info">
      <h2>${song.title}</h2>
      <p><span class="key">Key: ${song.key}</span></p>
    </div>
    `;

    content.innerHTML = songInfo + song.sections.map(section =>
      `<div class="section">
        <h3>${section.name}</h3>
        ${section.lines.map(line =>
          `<div class="line">
            ${line.map(({word, chord}) =>
              `<div class="word">${chord ? `<span class="chord">${chord}</span>` : ''}${word}</div>`
            ).join('')}
          </div>`
        ).join('')}
      </div>`
    ).join('');
  }


var scrollButton = document.getElementById('scroll');
var scrolling = false;
var speed = 1;

// Obtain references to the speed control buttons
var increaseSpeedButton = document.getElementById('increaseSpeed');
var decreaseSpeedButton = document.getElementById('decreaseSpeed');

// Update speed and button colors when the increase speed button is clicked
increaseSpeedButton.onclick = function() {
    if (speed < 4) {
        speed += 1;
    }
    updateButtonColors();
};

// Update speed and button colors when the decrease speed button is clicked
decreaseSpeedButton.onclick = function() {
    if (speed > -2) {
        speed -= 1;
    }
    updateButtonColors();
};

// Function to update button colors based on the current speed
function updateButtonColors() {
    increaseSpeedButton.className = speed > 1 ? 'active' : '';
    decreaseSpeedButton.className = speed < 1 ? 'active' : '';
}

scrollButton.onclick = function() {
  scrolling = !scrolling;
  document.getElementById('startIcon').style.display = scrolling ? 'none' : 'block';
  document.getElementById('stopIcon').style.display = scrolling ? 'block' : 'none';
  this.classList.toggle('scrolling');
    
  if (scrolling) {
    var scrollInterval = setInterval(function() {
      if (!scrolling) {
        clearInterval(scrollInterval);
      } else {
        window.scrollBy(0, speed);
      }
    }, 100);
  }
};

// Dark Mode
document.body.classList.add("dark-mode");
const toggle = document.getElementById("dark-mode-toggle");
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}
toggle.addEventListener("change", toggleDarkMode);