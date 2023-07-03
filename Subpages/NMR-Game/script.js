function addAdjacentPoints(datapoints) {
    var newDatapoints = [];
    
    var d = 0.01; // distance to move points orthogonally
    
    for (var i = 0; i < datapoints.length - 1; i++) {
        var point1 = datapoints[i];
        var point2 = datapoints[i + 1];
        
        newDatapoints.push(point1);
        
        // Calculate the points to add
        var midpoint1 = {
            x: point1.x + 0.1 * (point2.x - point1.x),
            y: point1.y + 0.1 * (point2.y - point1.y)
        };
        
        var midpoint2 = {
            x: point1.x + 0.9 * (point2.x - point1.x),
            y: point1.y + 0.9 * (point2.y - point1.y)
        };
        
        // Calculate orthogonal offsets
        var dx = point2.x - point1.x;
        var dy = point2.y - point1.y;

        // Determine direction of offset based on the y-coordinate
        var direction = (i > 0 && datapoints[i - 1].y < point1.y && point1.y > point2.y) ? -1 : 1;
        
        // Add the points with orthogonal offsets
        newDatapoints.push({
            x: midpoint1.x - direction * d * dy,
            y: midpoint1.y + direction * d * dx
        });
        
        newDatapoints.push({
            x: midpoint2.x + direction * d * dy,
            y: midpoint2.y - direction * d * dx
        });
    }
    
    // Don't forget to add the last point
    newDatapoints.push(datapoints[datapoints.length - 1]);
    
    return newDatapoints;
}


function generateGraph() {
    var molecule = document.getElementById('inputMolecule').value;
    var data = getNMRData(molecule);
    
    var datapoints = [];
    
    // Add point at 10
    datapoints.push({x: 10, y: 0});
    
    for (var i = 0; i < data.shifts.length; i++) {
        var splitting = data.splitting[i];
        var baseShift = data.shifts[i];
        var baseIntensity = data.intensities[i];
        
        // Add starting baseline point for each peak
        datapoints.push({x: baseShift - 0.05 * splitting / 2, y: 0});
        
        for (var j = 0; j < splitting; j++) {
            // Calculate the shift for this split peak
            var shift = baseShift - 0.05 * (splitting - 1) / 2 + 0.05 * j;
            var intensity = baseIntensity * (1 - Math.abs(j - (splitting - 1) / 2) / splitting);
            
            // Add the peak
            datapoints.push({x: shift, y: intensity});
            
            // Add a point halfway to the next peak, if there is a next peak
            if (j < splitting - 1) {
                var nextShift = baseShift - 0.05 * (splitting - 1) / 2 + 0.05 * (j + 1);
                var nextIntensity = baseIntensity * (1 - Math.abs(j + 1 - (splitting - 1) / 2) / splitting);
                datapoints.push({x: (shift + nextShift) / 2, y: (intensity + nextIntensity) / 10});
            }
        }
        
        // Add ending baseline point for each peak
        datapoints.push({x: baseShift + 0.05 * splitting / 2, y: 0});
    }
    
    // Add point at 0
    datapoints.push({x: 0, y: 0});
    
    // Sort the datapoints by x-axis values
    datapoints.sort(function(a, b) {
        return a.x - b.x;
    });
    
    datapoints = addAdjacentPoints(datapoints);

    var labels = datapoints.map(function(point) { return point.x; });
    var points = datapoints.map(function(point) { return point.y; });
    
    var ctx = document.getElementById('nmrGraph').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: molecule,
                data: points,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                pointStyle: 'circle', //false
                tension: 0.05,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    reverse: true,
                    title: {
                        display: true,
                        text: 'Shift (ppm)'
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            // Only show ticks at integer values
                            if (Number.isInteger(value)) {
                                return value;
                            }
                        }
                    }
                },
                y: {
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

function getNMRData(molecule) {
    return {
        shifts: [1.5, 3.2, 7.4],
        intensities: [3, 2, 1],
        splitting: [2, 1, 3]
    };
}
