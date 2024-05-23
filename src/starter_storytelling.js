import * as d3 from "d3";
import "./viz.css";

////////////////////////////////////////////////////////////////////
////////////////////////////  Init  ///////////////////////////////
const svg = d3.select("#svg-container").append("svg").attr("id", "svg");

let width = parseInt(d3.select("#svg-container").style("width"));
let height = parseInt(d3.select("#svg-container").style("height"));
const margin = { top: 25, right: 20, bottom: 60, left: 70 };

// parsing & formatting
const formatXAxis = d3.format("~s"); //숫자를 간결하게 표현하기 위한 포매팅 방식 (K, M)

// scale
const xScale = d3.scaleLog().range([margin.left, width - margin.right]);
// const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
const radiusScale = d3.scaleSqrt().range([0, 55]);
const colorScale = d3
  .scaleOrdinal()
  .range(["#84a59d", "#f5cac3", "#f6bd60", "#f28482"]); // #ccc

// axis
const xAxis = d3
  .axisBottom(xScale)
  .tickFormat((d) => formatXAxis(d))
  .tickValues([500, 1000, 2000, 4000, 8000, 16000, 32000, 64000]);

const yAxis = d3.axisLeft(yScale).ticks(5);

//  tooltip
const tooltip = d3
  .select("#svg-container")
  .append("div")
  .attr("class", "tooltip");

// svg elements
let circles, xUnit, yUnit, legendRects, legendTexts;

////////////////////////////////////////////////////////////////////
////////////////////////////  Load CSV  ////////////////////////////
let data = [];
let region;

let asiaSelected = false; //아시아라는 버튼이 선택이 안됐다
let americasSelected = false;
let africaSelected = false;
let europeSelected = false;

d3.csv("data/gapminder_combined.csv")
  .then((raw_data) => {
    // data parsing
    data = raw_data.map((d) => {
      d.population = parseInt(d.population);
      d.income = parseInt(d.income);
      d.year = parseInt(d.year);
      d.life_expectancy = parseInt(d.life_expectancy);
      return d;
    });

    // console.log(data);

    region = [...new Set(data.map((d) => d.region))];

    //  scale updated
    // xScale.domain(d3.extent(data, (d) => d.income));
    xScale.domain([500, d3.max(data, (d) => d.income)]);
    yScale.domain(d3.extent(data, (d) => d.life_expectancy));
    radiusScale.domain([0, d3.max(data, (d) => d.population)]);
    colorScale.domain(region);

    // axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis);

    // add circles
    circles = svg
      .selectAll("circles")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.income))
      .attr("cy", (d) => yScale(d.life_expectancy))
      .attr("r", (d) => radiusScale(d.population))
      .attr("fill", (d) => colorScale(d.region))
      .attr("stroke", "#fff");
    // .on("mousemove", function (event, d, index) {
    //   tooltip
    //     .style("left", event.pageX + 0 + "px")
    //     .style("top", event.pageY - 52 + "px")
    //     .style("display", "block")
    //     .html(`${d.country}`);

    //   d3.select(this).style("stroke-width", 3).attr("stroke", "#111");
    // })
    // .on("mouseout", function () {
    //   tooltip.style("display", "none");
    //   d3.select(this).style("stroke-width", 1).attr("stroke", "#fff");
    // });

    // Units
    xUnit = svg
      .append("text")
      .attr("transform", `translate(${width / 2}, ${height - 10})`)
      .text("GDP per capita")
      .attr("class", "unit");

    yUnit = svg
      .append("text")
      .attr("transform", "translate(20," + height / 2 + ") rotate(-90)")
      .text("Life expectancy")
      .attr("class", "unit");

    // Legend
    legendRects = svg
      .selectAll("legend-rects")
      .data(region)
      .enter()
      .append("rect")
      .attr("x", (d, i) => width - margin.right - 83)
      .attr("y", (d, i) => height - margin.bottom - 70 - 25 * i)
      .attr("width", 12)
      .attr("height", 17)
      .attr("fill", (d) => colorScale(d));

    legendTexts = svg
      .selectAll("legend-texts")
      .data(region)
      .enter()
      .append("text")
      .attr("x", (d, i) => width - margin.right - 83 + 20)
      .attr("y", (d, i) => height - margin.bottom - 70 - 25 * i + 15)
      .text((d) => d)
      .attr("class", "legend-texts");

    // Button Asia
    d3.select("#button-asia").on("click", () => {
      //클릭을 했을때 함수를 실행시켜라
      asiaSelected = !asiaSelected; //참,거짓을 반대로 한다는 뜻(눌렸을 때 반대되는 값이 저장)
      americasSelected = false; //중복픽을 막기 위해, 차이나 선택하면 아시아 선택해제
      africaSelected = false;
      europeSelected = false;
      // console.log(asiaSelected);

      // d3.select("#text-desc").text("asia Selected"); //설명창 간단히

      d3.select("#button-asia").classed("button-clicked", asiaSelected); //asiaSelected일 경우 버튼 클릭 클래스 지정(css)
      d3.select("#button-americas").classed("button-clicked", false); //아시아 버튼 눌렀을 경우 차이나 버튼 비활성화
      d3.select("#button-africa").classed("button-clicked", false);
      d3.select("#button-europe").classed("button-clicked", false);

      circles.attr("fill", (d) => {
        //속성 변화
        if (asiaSelected) {
          return d.region == "asia" ? colorScale(d.region) : "rgba(0,0,0,0.1)";
          //각 서클의 데이터를 봤을 때 region이 asia면 colorscale을 d.region으로 하자, 아니면 rgba(0,0,0,0.1)로 하자
        } else {
          return colorScale(d.region);
        }
      });
    });

    // Button americas
    d3.select("#button-americas").on("click", () => {
      americasSelected = !americasSelected;
      asiaSelected = false;
      africaSelected = false;
      europeSelected = false;

      d3.select("#button-americas").classed("button-clicked", americasSelected);
      d3.select("#button-asia").classed("button-clicked", false);
      d3.select("#button-africa").classed("button-clicked", false);
      d3.select("#button-europe").classed("button-clicked", false);

      circles.attr("fill", (d) => {
        if (americasSelected) {
          return d.region == "americas"
            ? colorScale(d.region)
            : "rgba(0,0,0,0.1)";
        } else {
          return colorScale(d.region);
        }
      });
    });

    // Button africa
    d3.select("#button-africa").on("click", () => {
      africaSelected = !africaSelected;
      asiaSelected = false;
      americasSelected = false;
      europeSelected = false;

      d3.select("#button-africa").classed("button-clicked", africaSelected);
      d3.select("#button-asia").classed("button-clicked", false);
      d3.select("#button-americas").classed("button-clicked", false);
      d3.select("#button-europe").classed("button-clicked", false);

      circles.attr("fill", (d) => {
        if (africaSelected) {
          return d.region == "africa"
            ? colorScale(d.region)
            : "rgba(0,0,0,0.1)";
        } else {
          return colorScale(d.region);
        }
      });
    });

    // Button europe
    d3.select("#button-europe").on("click", () => {
      europeSelected = !europeSelected;
      asiaSelected = false;
      africaSelected = false;
      americasSelected = false;

      d3.select("#button-europe").classed("button-clicked", europeSelected);
      d3.select("#button-asia").classed("button-clicked", false);
      d3.select("#button-africa").classed("button-clicked", false);
      d3.select("#button-americas").classed("button-clicked", false);

      circles.attr("fill", (d) => {
        if (europeSelected) {
          return d.region == "europe"
            ? colorScale(d.region)
            : "rgba(0,0,0,0.1)";
        } else {
          return colorScale(d.region);
        }
      });
    });
  })
  .catch((error) => {
    console.error("Error loading CSV data: ", error);
  });

////////////////////////////////////////////////////////////////////
////////////////////////////  Resize  //////////////////////////////
window.addEventListener("resize", () => {
  //  width, height updated
  width = parseInt(d3.select("#svg-container").style("width"));
  height = parseInt(d3.select("#svg-container").style("height"));

  //  scale updated
  xScale.range([margin.left, width - margin.right]);
  yScale.range([height - margin.bottom, margin.top]);

  //  axis updated
  d3.select(".x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  d3.select(".y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis);

  // circles updated
  circles
    .attr("cx", (d) => xScale(d.income))
    .attr("cy", (d) => yScale(d.life_expectancy))
    .attr("r", (d) => radiusScale(d.population));

  // units updated
  xUnit.attr("transform", `translate(${width / 2}, ${height - 10})`);
  yUnit.attr("transform", "translate(20," + height / 2 + ") rotate(-90)");

  //  legend updated
  legendRects
    .attr("x", (d, i) => width - margin.right - 83)
    .attr("y", (d, i) => height - margin.bottom - 70 - 25 * i);

  legendTexts
    .attr("x", (d, i) => width - margin.right - 83 + 20)
    .attr("y", (d, i) => height - margin.bottom - 70 - 25 * i + 15);
});
