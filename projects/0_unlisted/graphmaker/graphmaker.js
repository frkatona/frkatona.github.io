// Dark Mode
document.body.classList.add("dark-mode");
const toggle = document.getElementById("dark-mode-toggle");
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}
toggle.addEventListener("change", toggleDarkMode);

function processData(csv) {
  let lines = csv.split("\n");
  let headers = lines[0].split(",");
  let xData = [];
  let yData = [];

  for (let i = 1; i < lines.length; i++) {
      let data = lines[i].split(",");
      if (data.length === headers.length) {
          xData.push(parseFloat(data[0]));
          yData.push(parseFloat(data[1]));
      }
  }

  return { x: xData, y: yData };
}

function plotScatterplot(data) {
  let trace = {
      x: data.x,
      y: data.y,
      mode: "markers",
      type: "scatter"
  };

  let layout = {
      title: "Scatterplot"
  };

  Plotly.newPlot("scatterplot", [trace], layout);
}



document.getElementById("csvFile").addEventListener("change", function (event) {
  let file = event.target.files[0];
  if (file) {
      let reader = new FileReader();
      reader.onload = function (event) {
          let csvData = event.target.result;
          let data = processData(csvData);
          plotScatterplot(data);
      };
      reader.readAsText(file);
  }
});
