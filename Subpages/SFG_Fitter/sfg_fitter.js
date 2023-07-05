document.getElementById('csvFile').addEventListener('change', function(evt) {
    var file = evt.target.files[0];
    Papa.parse(file, {
        delimiter: " ", // specify the space delimiter
        complete: function(results) {
            var data = results.data;
            var x = data.map(function(value, index) { return parseFloat(value[0]); });
            var y = data.map(function(value, index) { return parseFloat(value[1]); });
    
            var gaussian = (t, a, b, c) => (a * Math.exp(-0.5 * ((t - b) / c) ** 2));
            var sumOfGaussians = (t, parameters) => {
                var total = 0;
                for(var i = 0; i < parameters.length; i += 3) {
                    total += gaussian(t, parameters[i], parameters[i + 1], parameters[i + 2]);
                }
                return total;
            };

            var initialGuess = Array(10 * 3).fill(1);
            var result = levenbergMarquardt([x, y], sumOfGaussians, { initialValues: initialGuess });

            var fittedY = x.map(function(value) { return sumOfGaussians(value, result.parameterValues); });

            var trace1 = {
                x: x,
                y: y,
                mode: 'markers',
                name: 'Data'
            };

            var trace2 = {
                x: x,
                y: fittedY,
                mode: 'lines',
                name: 'Fit'
            };

            var layout = {
                xaxis: { title: 'Wavenumber or Frequency' },
                yaxis: { title: 'Intensity' },
                title:'Data and Fit'
            };

            Plotly.newPlot('chart', [trace1, trace2], layout);
        }
    });
});
