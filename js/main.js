
var plotWidth = d3.select("#middle-col").node().getBoundingClientRect().width,
    plotHeight = window.innerHeight * 0.8;

var plot = d3.select("#plot")
    .attr("width", plotWidth)
    .attr("height", plotHeight);

var margin = {top: 50, right: 80, bottom: 50, left: 50},
    width = plotWidth - margin.left - margin.right,
    height = plotHeight - margin.top - margin.bottom;

var dateParse = d3.timeParse("%Y-%m-%d");

var colors = ["#EFB605", "#E58903", "#E01A25", "#C20049", "#991C71", "#66489F", "#2074A0", "#10A66E", "#7EB852"]

var state = {
      indicador: null,
      cantidad: null,
      unidad: null,
      macrozona: null,
      microzona: null,
      escala: null,
      data: null,
      filteredData: null,
      dates: null,
      yLabel: null,
      currentColor: 0,
    }

var lineOpacity = 0.8,
    threshold = 10;

var xScale = d3.scaleTime()
    .range([margin.left, width - margin.right])
var yScale;
var yLinearScale = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])
var yLogScale = d3.scaleLog()
    .range([height - margin.bottom, margin.top])
var line = d3.line()
    .curve(d3.curveMonotoneX);

var transition = 500;

var svg = plot.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var gXAxis = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + margin.left + "," + height + ")");
var gYAxis = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + (2 * margin.left) + "," + margin.top + ")")

var yLabel = gYAxis.append("g")
    .append("text")
    .attr("class", "y title")

var xAxis = d3.axisBottom()
            .tickFormat(d3.timeFormat("%d %B"))
            .ticks(d3.timeWeek.every(1))
            .tickSizeOuter(0);
var yAxis = d3.axisLeft();

var dot = svg.append("g")
    .attr("display", "none");

dot.append("circle")
    .attr("r", 2.5);

dot.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .attr("y", -8);

var label = svg.append("g")
    .attr("display", "none")

label.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("class", "curve-label")
    .attr("text-anchor", "middle")
    .attr("text-anchor", "start")

var datalist = d3.select("#microzonas"),
    searchText = d3.select("#search-text"),
    searchButton = d3.select("search-button");


var nameNoSpaces = function(name) {
  return name.toLowerCase().split(" ").join("");
}

var capitalize = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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

    // Delete "total" in Regiones and add Population
    let totalRegiones = data[1].filter(d => d.Region == 'Total')
    let indexTotal = data[1].indexOf(totalRegiones);
    data[1].splice(indexTotal, 1);
    data[1].forEach(function(ele){
      ele["Poblacion"] = labelsOutput[ele.Region];
    });

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
        } else if (state.indicador == 'muertes') {
          state.data = data[1];
        }
        state.yLabel = capitalize(state.indicador) + " " + state.cantidad + " " + unidad.options[unidad.selectedIndex].text;

        // if (series_pk !== null) series_pk.addEventListener('change', changeSeries);
        if (indicador !== null) indicador.addEventListener('change', function(){
          state.indicador = indicador.value;
          if (state.indicador == 'casos') {
            state.data = data[0];
            state.microzona = 'Comuna';
          } else if (state.indicador == 'muertes') {
            state.data = data[1];
            state.microzona = 'Region'; // TODO: Change value of "microzona" object and lock microzona
          }
          state.yLabel = capitalize(state.indicador) + " " + state.cantidad + " " + unidad.options[unidad.selectedIndex].text;
          drawPlot();
        });
        if (cantidad !== null) cantidad.addEventListener('change', function(){
          state.cantidad = cantidad.value;
          state.yLabel = capitalize(state.indicador) + " " + state.cantidad + " " + unidad.options[unidad.selectedIndex].text;
          drawPlot();
        });
        if (unidad !== null) unidad.addEventListener('change', function(){
          state.unidad = unidad.value;
          state.yLabel = capitalize(state.indicador) + " " + state.cantidad + " " + unidad.options[unidad.selectedIndex].text;
          drawPlot();
        });
        if (escala !== null) escala.addEventListener('change', function(){
          state.escala = escala.value;
          state.yLabel = capitalize(state.indicador) + " " + state.cantidad + " " + unidad.options[unidad.selectedIndex].text;
          drawPlot();
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

      datesString = state.data.columns.filter(d => d.slice(0,4) == '2020')
      var dates = datesString.map(d => dateParse(d))
      let factor;

      state.data.forEach(function(ele){

        if (state.unidad == "totales") {
          factor = 1.0;
        } else if (state.unidad == "tasa"){
          factor = ele.Poblacion / 100000.0;
        }

        ele.values = datesString.map(d => +ele[d] / factor);
        if (state.cantidad == "nuevos") {
          let newValues = ele.values.map(function(d,i){
            return d - ele.values[i-1] >= 0 ? d - ele.values[i-1] : 0;
          });
          ele.values = newValues.slice(1);
          state.dates = dates.slice(1);
        } else if (state.cantidad == "acumulados") {
          state.dates = dates;
        }

      });

      if (state.indicador == 'casos') {
        state.filteredData = state.data.filter(d => d.values[d.values.length - 1] > threshold);
      } else if (state.indicador == 'muertes') {
        state.filteredData = state.data;
      }

      // console.log(state.data)

      xScale.domain(d3.extent(state.dates))
      xAxis.scale(xScale)

      if (state.escala == "escala-logaritmica"){
        yScale = d3.scaleLog()
            .range([height - margin.bottom, margin.top])
            .domain([1, d3.max(state.filteredData, d => d3.max(d.values)) + 1])
        yAxis.scale(yScale)
            .tickValues([2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000])
            // .ticks(2)
            .tickFormat(d3.format('i'))
        line.x((d, i) => xScale(state.dates[i]))
          .y(d => yScale(d + 1));
      } else if (state.escala == "escala-lineal") {
        yScale = d3.scaleLinear()
            .range([height - margin.bottom, margin.top])
            .domain([0, d3.max(state.filteredData, d => d3.max(d.values))]).nice()
        yAxis.scale(yScale)
            .tickValues(d3.range(0, yScale.domain()[1] + 500, 500));
        line.x((d, i) => xScale(state.dates[i]))
          .y(d => yScale(d));
      }

      // Get microzona labels
      var microzonaLabels = new Set(state.filteredData.map(d => d[state.microzona]))
      microzonaLabels = [...microzonaLabels].sort()

      searchText.html("Selecciona una " + state.microzona.toLowerCase() + ":")

      var options = datalist.selectAll("option").data(microzonaLabels);

      options.enter().append("option")
        .on("click", console.log("hola"))
        .html(d => d);

      options.html(d => d);

      options.exit().remove();

      gXAxis.call(xAxis);
      gYAxis.call(yAxis);

      // gYAxis.select(".domain").remove()
      gYAxis.select(".y.title")
      	.attr("text-anchor", "end")
      	// .style("font-size", (mobileScreen ? 8 : 12) + "px")
        .style("font-size", "12px")
        .attr("fill", "black")
      	.attr("transform", "translate(18, 55) rotate(-90)")
      	.text(state.yLabel);

      // gYAxis.select(".tick:last-of-type text").clone()
      //   .attr("x", 3)
      //   .attr("text-anchor", "start")
      //   .attr("font-weight", "bold")
      //   .text(capitalize(state.indicador) + " " + state.cantidad + " " + state.unidad);

      var path = g.selectAll("path").data(state.filteredData);
      // console.log(state.data)

      path.enter().append("path")
      // .join("path")
        .transition()
        .duration(transition)
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .style("mix-blend-mode", "multiply")
        .attr("opacity", lineOpacity)
        .attr("class", d => "curve "+nameNoSpaces(d[state.microzona]))
        .attr("stroke", "lightgray")
        // .attr("stroke", d => d3.interpolateViridis(d3.max(d.values, e => e)/yScale.domain()[1]))
        .attr("d", d => line(d.values))

      path.transition()
        .duration(transition)
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .style("mix-blend-mode", "multiply")
        .attr("opacity", lineOpacity)
        .attr("class", d => "curve "+nameNoSpaces(d[state.microzona]))
        .attr("stroke", "lightgray")
        // .attr("stroke", d => d3.interpolateViridis(d3.max(d.values, e => e)/yScale.domain()[1]))
        .attr("d", d => line(d.values))

      path.exit().remove()

      svg.call(hover, g.selectAll("curve"))

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

        function moved() {
          d3.event.preventDefault();
          const mouse = d3.mouse(this);
          const xm = xScale.invert(mouse[0]-margin.left); // TODO: CONSTRAIN WITHIN RIGHT MARGIN
          const ym = yScale.invert(mouse[1]-margin.top);
          const i1 = d3.bisectLeft(state.dates, xm, 1);
          const i0 = i1 - 1;
          const i = xm - state.dates[i0] > state.dates[i1] - xm ? i1 : i0;
          var s;
          if (state.escala == "escala-logaritmica"){
            s = d3.least(state.filteredData, d => Math.abs(d.values[i] - ym + 1));
          } else if (state.escala == "escala-lineal") {
            s = d3.least(state.filteredData, d => Math.abs(d.values[i] - ym));
          }

          // console.log(s)
          d3.selectAll(".curve")
            .attr("opacity", 0.5)
            .attr("stroke","lightgray")

          d3.select(".curve."+nameNoSpaces(s[state.microzona]))
            .attr("opacity", 1.0)
            .attr("stroke", colors[state.currentColor])
            .attr("stroke-width", 2.0)

          path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();

          // Circle showing value
          dot.attr("fill", colors[state.currentColor])
            .attr("transform", function(d){
              if (state.escala == "escala-logaritmica"){
                return `translate(${xScale(state.dates[i])+margin.left},${yScale(s.values[i]+1)+margin.top})`;
              } else if (state.escala == "escala-lineal") {
                return `translate(${xScale(state.dates[i])+margin.left},${yScale(s.values[i])+margin.top})`;
              }
            });

          if (state.escala == "escala-logaritmica"){
            dot.select("text").text(s.values[i]); // TODO: IF LOG THEN WE NEED TO SUBSTRACT ONE
          } else if (state.escala == "escala-lineal") {
            dot.select("text").text(s.values[i]); // TODO: IF LOG THEN WE NEED TO SUBSTRACT ONE
          }

          // Label
          label.attr("fill", colors[state.currentColor])
            .attr("transform", function(d){
              if (state.escala == "escala-logaritmica"){
                return `translate(${xScale(state.dates[state.dates.length-1])+margin.left+5},${yScale(s.values[s.values.length-1] + 1)+margin.top+2})`;
              } else if (state.escala == "escala-lineal") {
                return `translate(${xScale(state.dates[state.dates.length-1])+margin.left+5},${yScale(s.values[s.values.length-1])+margin.top+2})`;
              }
            })
          label.select("text").text(s[state.microzona])

        }

        function entered() {
          path.style("mix-blend-mode", null).attr("stroke", "#ddd");
          dot.attr("display", null);
          label.attr("display", null);
        }

        function left() {
          d3.selectAll(".curve")
              .attr("opacity", lineOpacity)
              .attr("stroke", "lightgray")
              .attr("stroke-width", 1.0)
          path.style("mix-blend-mode", "multiply").attr("stroke", null);
          dot.attr("display", "none");
          label.attr("display", "none");
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

      d3.select("g.axis.y")
        .transition(200)
        .duration(500)
        .call(yAxis);

      var selection = d3.selectAll(".curve").data(state.filteredData)

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
