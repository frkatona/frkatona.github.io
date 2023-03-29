const fileInput = document.getElementById("csv-file");
const scatterplot = document.getElementById("scatterplot");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = d3.csvParse(e.target.result);
      drawScatterplot(data);
    };
    reader.readAsText(file);
  }
});

function drawScatterplot(data) {
  scatterplot.innerHTML = ""; // Clear the scatterplot

  // Set dimensions
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select("#scatterplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Set scales
  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  x.domain(d3.extent(data, d => +d.x));
  y.domain(d3.extent(data, d => +d.y));

  // Set axes
  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  // Append axes
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  // Append data points
  const dots = svg.selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", 5)
    .attr("cx", d => x(+d.x))
    .attr("cy", d => y(+d.y))
    .attr("fill", "steelblue")
    .on("mouseover", function (d) {
      d3.select(this).attr("r", 8).style("fill", "red");
    })
    .on("mouseout", function (d) {
      d3.select(this).attr("r", 5).style("fill", "steelblue");
    });

  // Append axis labels
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(" + (-margin.left / 1.5) + "," + (height / 2) + ")rotate(-90)")
    .text("Y Axis Label");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(" + (width / 2) + "," + (height + margin.bottom / 1.5) + ")")
    .text("X Axis Label");
}

