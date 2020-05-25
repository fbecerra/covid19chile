
var plotWidth = d3.select("#left-col").node().getBoundingClientRect().width,
    plotHeight = window.innerHeight * 0.8;

var plot = d3.select("#plot")
    .attr("width", plotWidth)
    .attr("height", plotHeight);

var margin = {top: 50, right: 80, bottom: 50, left: 50},
    // width = window.innerWidth - margin.left - margin.right, // Use the window's width
    // height = window.innerHeight - margin.top - margin.bottom; // Use the window's height
    width = plotWidth - margin.left - margin.right,
    height = plotHeight - margin.top - margin.bottom;

var dateParse = d3.timeParse("%Y-%m-%d");

var xScale = d3.scaleTime()
    .range([margin.left, width - margin.right])
var yScale;
var yLinearScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
var yLogScale = d3.scaleLog()
    .range([height - margin.bottom, margin.top])
var line = d3.line()
    .curve(d3.curveMonotoneX);
var line2 = d3.line()
    .curve(d3.curveMonotoneX)

var svg = plot.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var gXAxis = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.top) + ")");
var gYAxis = g.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ",0)");

var xAxis = d3.axisBottom()
            .tickFormat(d3.timeFormat("%d/%m"))
            // .ticks(dates.length)
            .tickSizeOuter(0);
var yAxis = d3.axisLeft();

var nameNoSpaces = function(name) {
  return name.toLowerCase().split(" ").join("");
}

Promise.all([
    d3.csv('https://raw.githubusercontent.com/MinCiencia/Datos-COVID19/master/output/producto1/Covid-19.csv')
]).then(function(data) {

    // console.log(data);
    datesString = data[0].columns.filter(d => d.slice(0,4) == '2020')
    dates = datesString.map(d => dateParse(d))
    data[0].forEach(function(ele){
      ele.values = datesString.map(d => +ele[d])
      // console.log(ele)
    })
    // console.log(dates);

    xScale.domain(d3.extent(dates))
    xAxis.scale(xScale)
      .ticks(dates.length);

    yScale = d3.scaleLinear()
        .range([height - margin.bottom, margin.top])
        .domain([0, d3.max(data[0], d => d3.max(d.values))]).nice()
    yAxis.scale(yScale);

    line.x(d => xScale(d.x))
      .y(d => yScale(d.y))
    line2.x((d, i) => xScale(dates[i]))
      .y(d => yScale(d))

    gXAxis.call(xAxis);
    gYAxis.call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
      .attr("x", 3)
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Casos Totales"));

    console.log(data[0]);

    var curves = g.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
    .selectAll("path")


    curves.data(data[0]).enter().append("path")
    // .join("path")
      .style("mix-blend-mode", "multiply")
      .attr("opacity", 0.8)
      .attr("class", d => "curve "+nameNoSpaces(d.Comuna))
      // .attr("stroke", "lightgray")
      .attr("stroke", d => d3.interpolateViridis(d3.max(d.values, e => e)/yScale.domain()[1]))
      .attr("d", d => line2(d.values))
      // .on("mouseover", function(){
      //   d3.selectAll(".curve")
      //     .attr("opacity", 0.5)
      //     .attr("stroke","lightgray")
      //   d3.select(this).attr("opacity", 1.0)
      //     .attr("stroke", d => d3.interpolateViridis(d3.max(d.values, e => e)/yScale.domain()[1]))
      // })
      // .on('mouseleave', function(){
      //   d3.selectAll(".curve")
      //     .attr("opacity", 0.8)
      //     .attr("stroke", d => d3.interpolateViridis(d3.max(d.values, e => e)/yScale.domain()[1]))
      // });

    svg.call(hover, curves)

    function hover(svg, path) {

      if ("ontouchstart" in document) svg
          .style("-webkit-tap-highlight-color", "transparent")
          .on("touchmove", moved)
          .on("touchstart", entered)
          .on("touchend", left)
      else svg
          .on("mousemove", moved)
          .on("mouseenter", entered)
          .on("mouseleave", left);

      const dot = svg.append("g")
          .attr("display", "none");

      dot.append("circle")
          .attr("r", 2.5);

      dot.append("text")
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .attr("text-anchor", "middle")
          .attr("y", -8);

      function moved() {
        d3.event.preventDefault();
        const mouse = d3.mouse(this);
        const xm = xScale.invert(mouse[0]-margin.left);
        const ym = yScale.invert(mouse[1]-margin.top);
        const i1 = d3.bisectLeft(dates, xm, 1);
        const i0 = i1 - 1;
        const i = xm - dates[i0] > dates[i1] - xm ? i1 : i0;
        const s = d3.least(data[0], d => Math.abs(d.values[i] - ym));
        // console.log(s)
        d3.selectAll(".curve")
            .attr("opacity", 0.5)
            .attr("stroke","lightgray")
        d3.select(".curve."+nameNoSpaces(s.Comuna))
          .attr("opacity", 1.0)
          .attr("stroke", d => d3.interpolateViridis(d3.max(s.values, e => e)/yScale.domain()[1]))
        path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
        dot.attr("transform", `translate(${xScale(dates[i])+margin.left},${yScale(s.values[i])+margin.top})`);
        dot.select("text").text(s.values[i]);
      }

      function entered() {
        path.style("mix-blend-mode", null).attr("stroke", "#ddd");
        dot.attr("display", null);
      }

      function left() {
        d3.selectAll(".curve")
            .attr("opacity", 0.8)
            .attr("stroke", d => d3.interpolateViridis(d3.max(d.values, e => e)/yScale.domain()[1]))
        path.style("mix-blend-mode", "multiply").attr("stroke", null);
        dot.attr("display", "none");
      }
    }

    // data[0].forEach(function(ele){
    //
    //
    //   texts.attr("x", width - margin.left/2 - margin.right/2)
    //     .attr("y", yScale(datos[datos.length-1].y) + 5)
    //     .attr("fill", d3.interpolateViridis(datos[datos.length-1].y/yScale.domain()[1]))
    //     .attr("class", "name "+nameNoSpaces(ele.Comuna))
    //     // .attr("opacity", 0.5)
    //     .attr("text-anchor", "start")
    //     .attr("font-size", "1rem")
    //     // .attr("font-weight", "bold")
    //     .on("mouseover", function(){
    //       d3.selectAll(".curve")
    //         .attr("opacity", 0.2)
    //       d3.select(".curve."+nameNoSpaces(ele.Comuna)).attr("opacity", 1.0)
    //
    //       d3.selectAll(".name")
    //         .attr("opacity", 0.2)
    //       d3.select(".name."+nameNoSpaces(ele.Comuna)).attr("opacity", 1.0)
    //     })
    //     .on('mouseleave', function(){
    //       d3.selectAll(".curve")
    //         .attr("opacity", 1.0)
    //
    //       d3.selectAll(".name")
    //         .attr("opacity", 1.0)
    //     });
    // })

    // Update yAxis scale
    d3.select("#escala")
      .on("change", function(d){
        let formValue = this.value;
        console.log(formValue)

        if (formValue === "escala-logaritmica"){
          yScale = d3.scaleLog()
              .range([height - margin.bottom, margin.top])
              .domain([1, d3.max(data[0], d => d3.max(d.values)) + 1])
          yAxis.scale(yScale)
              .tickValues([2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000])
              // .ticks(2)
              .tickFormat(d3.format('i'))
          line2.y(d => yScale(d + 1));
        } else if (formValue === "escala-lineal") {
          yScale = d3.scaleLinear()
              .range([height - margin.bottom, margin.top])
              .domain([0, d3.max(data[0], d => d3.max(d.values))]).nice()
          yAxis.scale(yScale);
          line2.y(d => yScale(d));
        }

        d3.select("g.axis.y")
          .transition(200)
          .duration(500)
          .call(yAxis);

        var selection = d3.selectAll(".curve").data(data[0])

        selection.enter()
          .append("path")
          .transition(500)
          .attr("d", function(d){
            return line2(d.values)
          })

        selection.transition(500)
          .attr("d", function(d){
            return line2(d.values)
          })

        selection.exit().remove()


        // texts.transition()
        //   .duration(500)
        //   .attr("y", 0)
      })

  })
  .catch(function(error){
    console.log(error)
  })
