
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

var state = {
      indicador: null,
      cantidad: null,
      unidad: null,
      macrozona: null,
      microzona: null,
      escala: null,
      data: null,
      dates: null,
      yLabel: null,
    }

var xScale = d3.scaleTime()
    .range([margin.left, width - margin.right])
var yScale;
var yLinearScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
var yLogScale = d3.scaleLog()
    .range([height - margin.bottom, margin.top])
var line = d3.line()
    .curve(d3.curveMonotoneX);

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

var curves = g.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")

var nameNoSpaces = function(name) {
  return name.toLowerCase().split(" ").join("");
}

Promise.all([
    d3.csv('https://raw.githubusercontent.com/MinCiencia/Datos-COVID19/master/output/producto1/Covid-19.csv'),
    d3.csv('https://raw.githubusercontent.com/MinCiencia/Datos-COVID19/master/output/producto14/FallecidosCumulativo.csv')
]).then(function(data) {

    // Calculate region population
    data[0].forEach(function(ele){
      ele.Poblacion = +ele.Poblacion;
    })
    var labelsRegiones = new Set(data[0].map(d => d.Region));
    var labelsArray = [...labelsRegiones];
    var labelsOutput = {};
    for (let label of labelsArray){
      let poblacionRegion = data[0].filter(d => d.Region == label).reduce(function(a,b){
        return a + b.Poblacion;
      }, 0);
      labelsOutput[label] = poblacionRegion;
    }

    // Delete "total" in Regiones
    let totalRegiones = data[1].filter(d => d.Region == 'Total')
    let indexTotal = data[1].indexOf(totalRegiones);
    data[1].splice(indexTotal, 1);

    // Add listeners to form objects
    addListeners();
    drawPlot();

    function addListeners() {
        indicador = document.querySelector('#indicador');
        cantidad = document.querySelector('#cantidad');
        unidad = document.querySelector('#unidad');
        macrozona = document.querySelector('#macrozona');
        microzona = document.querySelector('#microzona');
        escala = document.querySelector('#escala');

        state.indicador = indicador.value;
        state.cantidad = cantidad.value;
        state.unidad = unidad.value;
        state.macrozona = macrozona.value;
        state.microzona = microzona.value;
        state.escala = escala.value;

        if (state.indicador == 'casos') {
          state.data = data[0];
          state.yLabel = 'Casos'
        } else if (state.indicador == 'muertes') {
          state.data = data[1];
          state.yLabel = 'Muertes'
        }

        // if (series_pk !== null) series_pk.addEventListener('change', changeSeries);
        if (indicador !== null) indicador.addEventListener('change', function(){
          state.indicador = indicador.value;
          if (state.indicador == 'casos') {
            state.data = data[0];
            state.yLabel = 'Casos';
            state.microzona = 'Comuna';
          } else if (state.indicador == 'muertes') {
            state.data = data[1];
            state.yLabel = 'Muertes';
            state.microzona = 'Region'; // TODO: Change value of "microzona" object and lock microzona
          }
          drawPlot();
        });
        if (escala !== null) escala.addEventListener('change', function(){
          state.escala = escala.value;
          drawPlot();
          // loadData();
        });
        // if (colorby !== null) colorby.addEventListener('change', function(){
        //   state.fields_schema.colorby.selected = colorby.value;
        //   drawPoints();
        // });
        // if (hover !== null) hover.addEventListener('change', function(){
        //   state.fields_schema.hover.selected = hover.value;
        // });
        // if (coords !== null) coords.addEventListener('change', function(){
        //   if (coords.value == 't-SNE') {
        //     state.currentCoords.x = "tSNE_X.coord.coord_tSNE.amp_RA.info.csv.9";
        //     state.currentCoords.y = "tSNE_Y.coord.coord_tSNE.amp_RA.info.csv.9";
        //   } else if (coords.value == 'PCA') {
        //     state.currentCoords.x = "PC1.coord.coord_PCA.0.1.n6.info.csv.10";
        //     state.currentCoords.y = "PC2.coord.coord_PCA.0.1.n6.info.csv.10"
        //   }
        //   drawPoints();
        // });
    }

    function drawPlot() {

      console.log(state.data)

      datesString = state.data.columns.filter(d => d.slice(0,4) == '2020')
      dates = datesString.map(d => dateParse(d))
      state.data.forEach(function(ele){
        ele.values = datesString.map(d => +ele[d]);
        if (state.microzona == 'Region') {
          ele["Poblacion"] = labelsOutput[ele.Region];
        }
      })

      // console.log(state, dates)

      xScale.domain(d3.extent(dates))
      xAxis.scale(xScale)
        .ticks(dates.length);

      yScale = d3.scaleLinear()
          .range([height - margin.bottom, margin.top])
          .domain([0, d3.max(state.data, d => d3.max(d.values))]).nice()
      yAxis.scale(yScale);

      line.x((d, i) => xScale(dates[i]))
        .y(d => yScale(d))

      gXAxis.call(xAxis);
      gYAxis.call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Casos Totales"));

      var path = g.selectAll("path").data(state.data)

      path.attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .style("mix-blend-mode", "multiply")
        .attr("opacity", 0.8)
        .attr("class", d => "curve "+nameNoSpaces(d[state.microzona]))
        // .attr("stroke", "lightgray")
        .attr("stroke", d => d3.interpolateViridis(d3.max(d.values, e => e)/yScale.domain()[1]))
        .attr("d", d => line(d.values))

      path.enter().append("path")
      // .join("path")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .style("mix-blend-mode", "multiply")
        .attr("opacity", 0.8)
        .attr("class", d => "curve "+nameNoSpaces(d[state.microzona]))
        // .attr("stroke", "lightgray")
        .attr("stroke", d => d3.interpolateViridis(d3.max(d.values, e => e)/yScale.domain()[1]))
        .attr("d", d => line(d.values))
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

      path.exit().remove()

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
          const xm = xScale.invert(mouse[0]-margin.left); // TODO: CONSTRAIN WITHIN RIGHT MARGIN
          const ym = yScale.invert(mouse[1]-margin.top);
          const i1 = d3.bisectLeft(dates, xm, 1);
          const i0 = i1 - 1;
          const i = xm - dates[i0] > dates[i1] - xm ? i1 : i0;
          const s = d3.least(state.data, d => Math.abs(d.values[i] - ym));
          // console.log(s)
          d3.selectAll(".curve")
              .attr("opacity", 0.5)
              .attr("stroke","lightgray")
          d3.select(".curve."+nameNoSpaces(s[state.microzona]))
            .attr("opacity", 1.0)
            .attr("stroke", d => d3.interpolateViridis(d3.max(s.values, e => e)/yScale.domain()[1]))
          path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
          dot.attr("fill", d => d3.interpolateViridis(d3.max(s.values, e => e)/yScale.domain()[1]))
            .attr("transform", `translate(${xScale(dates[i])+margin.left},${yScale(s.values[i])+margin.top})`);
          dot.select("text").text(s.values[i]); // TODO: IF LOG THEN WE NEED TO SUBSTRACT ONE
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


      // state.data.forEach(function(ele){
      //
      //
      //   texts.attr("x", width - margin.left/2 - margin.right/2)
      //     .attr("y", yScale(datos[datos.length-1].y) + 5)
      //     .attr("fill", d3.interpolateViridis(datos[datos.length-1].y/yScale.domain()[1]))
      //     .attr("class", "name "+nameNoSpaces(ele[state.microzona]))
      //     // .attr("opacity", 0.5)
      //     .attr("text-anchor", "start")
      //     .attr("font-size", "1rem")
      //     // .attr("font-weight", "bold")
      //     .on("mouseover", function(){
      //       d3.selectAll(".curve")
      //         .attr("opacity", 0.2)
      //       d3.select(".curve."+nameNoSpaces(ele[state.microzona])).attr("opacity", 1.0)
      //
      //       d3.selectAll(".name")
      //         .attr("opacity", 0.2)
      //       d3.select(".name."+nameNoSpaces(ele[state.microzona])).attr("opacity", 1.0)
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


      if (state.escala === "escala-logaritmica"){
        yScale = d3.scaleLog()
            .range([height - margin.bottom, margin.top])
            .domain([1, d3.max(state.data, d => d3.max(d.values)) + 1])
        yAxis.scale(yScale)
            .tickValues([2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000])
            // .ticks(2)
            .tickFormat(d3.format('i'))
        line.y(d => yScale(d + 1));
      } else if (state.escala === "escala-lineal") {
        yScale = d3.scaleLinear()
            .range([height - margin.bottom, margin.top])
            .domain([0, d3.max(state.data, d => d3.max(d.values))]).nice()
        yAxis.scale(yScale);
        line.y(d => yScale(d));
      }

      d3.select("g.axis.y")
        .transition(200)
        .duration(500)
        .call(yAxis);

      var selection = d3.selectAll(".curve").data(state.data)

      selection.enter()
        .append("path")
        .transition(500)
        .attr("d", function(d){
          return line(d.values)
        })

      selection.transition(500)
        .attr("d", function(d){
          return line(d.values)
        })

      selection.exit().remove()


      // texts.transition()
      //   .duration(500)
      //   .attr("y", 0)
    }
  })
  .catch(function(error){
    console.log(error)
  })
