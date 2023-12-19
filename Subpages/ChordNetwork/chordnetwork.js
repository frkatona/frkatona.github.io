// Width and height of the SVG
var width = 960,
    height = 500;

var boxWidth = 50;
var nodeRadius = 10;

var boxCenterOffset = boxWidth / 2;

// Create the SVG container and set the origin
var svg = d3.select("#network-diagram").append("svg")
    .attr("width", width)
    .attr("height", height);

// Sample data for four boxes
var boxData = [
  {x: 100, y: height / 2},
  {x: 300, y: height / 2},
  {x: 500, y: height / 2},
  {x: 700, y: height / 2}
];

// Sample links data
var links = [
    {source: 1, target: 0},
    {source: 2, target: 1},
    // ... other links
  ];
  
// Sample nodes data
var nodes = [
    {id: 1, value: "A", box: 0},
    {id: 2, value: "B", box: 1},
    // ... other nodes
  ];''

// Draw the links
var link = svg.selectAll(".link")
    .data(links)
    .enter().append("line")
    .attr("class", "link")
    .attr("x1", d => boxData[d.source].x + boxCenterOffset) // start at center of source box
    .attr("y1", d => boxData[d.source].y + boxCenterOffset) // start at center of source box
    .attr("x2", d => nodes[d.target].x) // end at center of target node
    .attr("y2", d => nodes[d.target].y); // end at center of target node


// Interactivity for control sliders
d3.select("#nodeDistance").on("input", function() {
  var distance = +this.value;
  // Update node positions based on slider
  node.attr("cy", d => boxData[d.box].y + distance);
  // Update link positions
  link.attr("y2", d => boxData[d.target].y + distance);
});

// Draw the boxes
var boxes = svg.selectAll(".box")
    .data(boxData)
    .enter().append("rect")
    .attr("class", "box")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("width", 50)
    .attr("height", 50);



// Draw the nodes
var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 10)
    .attr("cx", d => boxData[d.box].x + 50)
    .attr("cy", d => boxData[d.box].y + 75);

// Add labels to nodes
node.append("title")
    .text(d => d.value);

// Add interactivity to nodes
node.on("click", function(event, d) {
  // Populate the corresponding box with the node's value
  var box = d3.select(boxes.nodes()[d.box]);
  box.text(d.value);
});

