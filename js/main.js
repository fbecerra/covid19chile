
var plotWidth = d3.select("#left-col").node().getBoundingClientRect().width,
    plotHeight = window.innerHeight * 0.8;

var plot = d3.select("#plot")
    .attr("width", plotWidth)
    .attr("height", plotHeight);

var margin = {top: 50, right: 50, bottom: 50, left: 50},
    // width = window.innerWidth - margin.left - margin.right, // Use the window's width
    // height = window.innerHeight - margin.top - margin.bottom; // Use the window's height
    width = plotWidth - margin.left - margin.right,
    height = plotHeight - margin.top - margin.bottom;

var dateParse = d3.timeParse("%Y-%m-%d");

var xScale = d3.scaleTime()
    .range([margin.left, width - margin.right])
var yScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
var line = d3.line()
    .curve(d3.curveMonotoneX)

var svg = plot.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var xAxis = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.top) + ")")
var yAxis = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)")

var nameNoSpaces = function(name) {
  return name.toLowerCase().split(" ").join("");
}

d3.csv('data/casos_por_comuna.csv')
  .then(function(data) {
    // console.log(data);
    datesString = data.columns.filter(d => d.slice(0,4) == '2020')
    dates = datesString.map(d => dateParse(d))
    data.forEach(function(ele){
      ele.cases = datesString.map(d => +ele[d])
      // console.log(ele)
    })
    // console.log(dates);

    xScale.domain(d3.extent(dates))
    yScale.domain([0, d3.max(data, d => d3.max(d.cases))]).nice()
    // console.log(xScale.domain(), yScale.domain());

    line.x(d => xScale(d.x))
      .y(d => yScale(d.y))

    xAxis.call(d3.axisBottom(xScale)
                .tickFormat(d3.timeFormat("%d/%m"))
                .ticks(dates.length)
                .tickSizeOuter(0));
    yAxis.call(d3.axisLeft(yScale))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
      .attr("x", 3)
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Casos Totales"));

    data.forEach(function(ele){

      let datos = ele.cases.map(function(d,i){
        return {x: dates[i], y: d};
      });

      // console.log(ele);

      svg.append("path")
          .datum(datos)
          .attr("fill", "none")
          .attr("stroke", d => d3.interpolateViridis(d3.max(datos, e => e.y)/yScale.domain()[1]))
          .attr("stroke-width", 2.0)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", line)
          .attr("class", "curve "+nameNoSpaces(ele.Comuna))
          // .attr("class", ele.Comuna)
          .on("mouseover", function(){
            d3.selectAll(".curve")
              .attr("opacity", 0.2)
            d3.select(this).attr("opacity", 1.0)
          })
          .on('mouseleave', function(){
            d3.selectAll(".curve")
              .attr("opacity", 1.0)
          });

      svg.append("text")
        .text(ele.Comuna)
        .attr("x", width - margin.left/2 - 20)
        .attr("y", yScale(datos[datos.length-1].y) + 5)
        .attr("fill", d3.interpolateViridis(datos[datos.length-1].y/yScale.domain()[1]))
        .attr("class", "name "+nameNoSpaces(ele.Comuna))
        .attr("text-anchor", "start")
        // .attr("font-weight", "bold")
        .on("mouseover", function(){
          d3.selectAll(".curve")
            .attr("opacity", 0.2)
          d3.select(".curve."+nameNoSpaces(ele.Comuna)).attr("opacity", 1.0)

          d3.selectAll(".name")
            .attr("opacity", 0.2)
          d3.select(".name."+nameNoSpaces(ele.Comuna)).attr("opacity", 1.0)
        })
        .on('mouseleave', function(){
          d3.selectAll(".curve")
            .attr("opacity", 1.0)

          d3.selectAll(".name")
            .attr("opacity", 1.0)
        });
    })

  })
  .catch(function(error){
    console.log(error)
  })
