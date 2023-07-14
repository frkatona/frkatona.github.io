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
    var content = document.getElementById('content');

    var songInfo = `
    <div class="song-info">
      <h2>${song.title}</h2>
      <p><span class="key">Key: ${song.key}</span>, <span class="capo">Capo: ${song.capo}</span></p>
    </div>
    `;

    content.innerHTML = songInfo + song.sections.map(section =>
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
  }
  

var scrollButton = document.getElementById('scroll');
var scrolling = false;
var speed = 1; // Adjust the scrolling speed here

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

