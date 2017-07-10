let dataRes = "";

let tags = {google:[],watson:[]};
let combinedResults = [];

let extractTags = () => {

  let url = $(".form-control").val();
  videoid = url.split("=")[1];
  url = encodeURIComponent(url);


  $(".actualyoutube iframe").remove();
  $('<iframe width="560" height="315" frameborder="0" allowfullscreen></iframe>')
      .attr("src", "http://www.youtube.com/embed/" + videoid)
      .appendTo(".actualyoutube");

  $(".loaderWatson").css("display","block");
  return new Promise(
    (resolve, reject) => {

      $.ajax({
          // Your server script to process the upload
          url: '/api/google-speech-to-text?url_address='+url,
          method: 'GET',

          success: function(data){
            dataRes = data;
            $(".loaderWatson").css("display","none");



            let googleArray = data.google.filter(function(val) {
              return val.type !== "OTHER";
            });
            tags.google = googleArray;

            let watsonArray = [];
            for (i in data.watson) {
              if (i === "language") {
                continue;
              }
              for (j in data.watson[i]) {
                watsonArray.push(data.watson[i][j]);;
              }
            }
            tags.watson = watsonArray;

            console.log(tags);


            //terminar esto y d3
            for(i in tags){
            	for(j in tags[i]){
              	try{ //Google
                	combinedResults.push({'text':tags[i][j].name,'size':tags[i][j].salience*100});
                }catch(e){

                }
              	try{ //Google
                	combinedResults.push({'text':tags[i][j].text,'size':tags[i][j].relevance*100});
                }catch(e){

                }
              }
            }
            combinedResults = combinedResults.filter(function(val) {
              return val.text !== undefined;
            });
            drawCloud();
            resolve();
            // var ul = document.getElementById("entidades");
            // for (var i = 0; i < data.entities.length; i++) {
            //
            //   var li = document.createElement("li");
            //   li.appendChild(document.createTextNode(data.entities[i].text));
            //   ul.appendChild(li);
            //
            // }
            //
            // var ul = document.getElementById("conceptos");
            // for (var i = 0; i < data.concepts.length; i++) {
            //
            //   var li = document.createElement("li");
            //   li.appendChild(document.createTextNode(data.concepts[i].text));
            //   ul.appendChild(li);
            //
            // }
            //
            // var ul = document.getElementById("keywords");
            // for (var i = 0; i < data.keywords.length; i++) {
            //
            //   var li = document.createElement("li");
            //   li.appendChild(document.createTextNode(data.keywords[i].text));
            //   ul.appendChild(li);
            //
            // }

          },
          error: function(err){
          },
          // Custom XMLHttpRequest
          xhr: function() {
              var myXhr = $.ajaxSettings.xhr();
              if (myXhr.upload) {
                  // For handling the progress of the upload
                  myXhr.upload.addEventListener('progress', function(e) {
                      if (e.lengthComputable) {
                          $('progress').attr({
                              value: e.loaded,
                              max: e.total,
                          });
                      }
                  } , false);
              }
              return myXhr;
          },
      });

    }
  )
}

function drawCloud(){

  var color = d3.scale.linear()
  .domain([0,1,2,3,4,5,6,10,15,20,100])
  .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]);

  d3.layout.cloud().size([800, 300])
  .words(combinedResults)
  .rotate(0)
  .fontSize(function(d) { return d.size; })
  .on("end", draw)
  .start();

  function draw(words) {
    d3.select("#divSvg").append("svg")
    .attr("width", 850)
    .attr("height", 350)
    .attr("class", "wordcloud")
    .append("g")
    // without the transform, words words would get cutoff to the left and top, they would
    // appear outside of the SVG area
    .attr("transform", "translate(320,200)")
    .selectAll("text")
    .data(words)
    .enter().append("text")
    .style("font-size", function(d) { return d.size + "px"; })
    .style("fill", function(d, i) { return color(i); })
    .attr("transform", function(d) {
      return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
    })
    .text(function(d) { return d.text; });
  }

}
