/* global _ */

var format_result = require("./format_result").format_result;

var listToArray = function(xs) {
  var pair = xs;
  var kar = xs[0];
  var a = [];

  while(pair.length == 2) {
    var nextVal = pair[0];
    /*
    if (Object.prototype.toString.call( nextVal ) === '[object Array]') {
      nextVal = listToArray(nextVal);
    } */
    a.push(nextVal);
    pair = pair[1];
  }
  return a;
};

var formatPercent = d3.format(".0%");

function erinSort(array) {
  var firstElem = array[0];
  if (typeof(firstElem) == "number") {
    return array.sort(function(a,b) {return a-b});
  }
  if (typeof(firstElem) == "string") {
    return array.sort();
  }
  if (Object.prototype.toString.call(firstElem) === '[object Array]') {
    return array;
  }
  return array;
}

_hist = function(samps, title) {

  // TODO: this is a hack. we want proper conversion of data types
  var values = erinSort(listToArray(samps)).map(function(x) {return format_result(x);}),
      strvalues = values,//values.map(function(x) {return format_result(x);}),
      n = values.length,
      counts = _(strvalues)
        .uniq()
        .map(function(val) {
          return {
            value: val,
            freq: _(strvalues).filter(function(x) {return x == val;}).length / n
          };
        }),
      maxFreq = _(counts).chain().map(function(x) { return x.freq}).max().value();

  return function($div) {

    var $histDiv = $("<div></div>").appendTo($div);
    var div = $histDiv[0];
    
    //TODO: make left margin vary depending on how long the names of the elements in the list are
    var margin = {top: 40, right: 20, bottom: 60, left: 60},
        width = 0.8 * $div.width() - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scale.linear()
          .domain([0, maxFreq])
          .range([0, width]);
    var y = d3.scale.ordinal()
          .domain(values)
          .rangeRoundBands([height, 0], .1);

    var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom")
                  .tickFormat(formatPercent);
    var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient("left");

    var svg = d3.select(div).append("svg")
          .attr("class", "chart")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height+ margin.top + margin.bottom)
          .style('margin-left', '10%')
          .style('margin-top', '20px')
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // d3.tsv("data.tsv", type, function(error, data) {
    //   debugger;
    //   x.domain(data.map(function(d) { return d.letter; }));
    //   y.domain([0, d3.max(data, function(d) { return d.frequency; })]);
    
    var data = counts;

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .text("Frequency")
      .attr("dy", "3em")
      .attr("x", (width/2))
      .attr("text-anchor", "middle");

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", function(d) {return y(d.value);})
      .attr("width", function(d) { return x(d.freq); })
      .attr("height", y.rangeBand());
    // });
    
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .attr("stroke", "none") 
        .attr("fill", "black")
        .text(title);
        
    var $clearButton = $("<button>Delete Histogram</button>")
    $clearButton.appendTo($histDiv);
    $clearButton.click(function() {
      $histDiv.remove();
    });

    return data;

  };

};

_density = function(samps, title, withHist) {

  // TODO: this is a hack. we want proper conversion of data types
  var values = erinSort(listToArray(samps)),
      n = values.length,
      counts = _(values)
        .uniq()
        .map(function(val) {
          return {
            value: val,
            freq: _(values).filter(function(x) {return x == val;}).length / n
          };
        }),
      maxFreq = _(counts).chain().map(function(x) { return x.freq}).max().value();

  return function($div) {

    var $densDiv = $("<div></div>").appendTo($div);
    var div = $densDiv[0];
    
    //TODO: make left margin vary depending on how long the names of the elements in the list are
    var margin = {top: 40, right: 20, bottom: 30, left: 40},
        width = 0.8 * $div.width() - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;
        
    var xMin = Math.min.apply(Math, values);
    var xMax = Math.max.apply(Math, values);
    var range = xMax - xMin;
    var x = d3.scale.linear()
        .domain([xMin, xMax])
        .range([0, width]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var frequencies = counts.map(function(x) {return x.freq;});
    var yMax = Math.max.apply(Math, frequencies);
    var y = d3.scale.linear()
        .domain([0, yMax])
        .range([height, 0]);
    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(5)
        .orient("left");
        //.tickFormat(d3.format("%"));

    var line = d3.svg.line()
        .x(function(d) { return x(d[0]); })
        .y(function(d) { return y(d[1]); });

    var svg = d3.select(div).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height+ margin.top + margin.bottom)
          .style('margin-left', '10%')
          .style('margin-top', '20px')
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    if (withHist) {
      drawHist(svg, counts, values, width, height, y, xMax, xMin);
    }

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
        
    function kernelDensityEstimator(kernel, x) {
      return function(sample) {
        return x.map(function(x) {
          return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
        });
      };
    }

    function epanechnikovKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
      };
    }

    var kde = kernelDensityEstimator(epanechnikovKernel(3), x.ticks(100));
    svg.append("path")
        .datum(kde(values))
        .attr("class", "line")
        .attr("d", line);
    
    
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .attr("stroke", "none") 
        .attr("fill", "black")
        .text(title);
 
    var $clearButton = $("<button>Delete Density Plot</button>")
    $clearButton.appendTo($densDiv);
    $clearButton.click(function() {
      $densDiv.remove();
    });

    var data = counts;
    return data;

  };

};

function drawHist(svg, counts, values, width, height, y, xMax, xMin) {
  var histX = d3.scale.ordinal()
                .domain(values)
                .rangeRoundBands([0, width], .1);
  svg.selectAll(".bar")
    .data(counts)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("fill", "none")
    .attr("y", function(d) { return y(d.freq);})
    .attr("x", function(d) {return histX(d.value);})
    .attr("height", function(d) { return height - y(d.freq);})
    .attr("width", histX.rangeBand());
}
