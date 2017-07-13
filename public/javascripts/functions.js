let dataRes = "";

let tags = {google:[],watson:[]};
let combinedResults = [];

let extractTags = () => {

  //Tomo el url del form y lo encodeo
  let url = $(".form-control").val();
  videoid = url.split("=")[1];
  url = encodeURIComponent(url);

  //Cargo el video de youtube para ver en vivo
  $(".actualyoutube iframe").remove();
  $('<iframe width="560" height="315" frameborder="0" allowfullscreen></iframe>')
      .attr("src", "http://www.youtube.com/embed/" + videoid)
      .appendTo(".actualyoutube");

  //Limpio los containers de resultados
  $("#divSvg").html("");
  $("#transcription").html("");
  //Activo los gifs
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

            $("#transcription").html(data.transcription);



            let googleArray = data.google.filter(function(val) {
              // return val.type !== "OTHER";
              return true;
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

            //Guardo los scores en array, para dps buscar el MAX y MIN
            let googleScores = [];
            let nluScores = [];
            //terminar esto y d3
            for(i in tags){
            	for(j in tags[i]){
              	try{ //Google
                	combinedResults.push({'text':tags[i][j].name,'size':tags[i][j].salience,"origin":"google"});
                  googleScores.push(tags[i][j].salience);
                }catch(e){

                }
              	try{ //NLU
                	combinedResults.push({'text':tags[i][j].text,'size':tags[i][j].relevance,"origin":"nlu"});
                  nluScores.push(tags[i][j].relevance*100)
                }catch(e){

                }
              }
            }

            //Limpio los undefined y los NaN // Hago display de los arrays de salience y relevance
            googleScores = googleScores.filter(function(val){return val !== undefined && !isNaN(val)})
            nluScores = nluScores.filter(function(val){return val !== undefined && !isNaN(val)})
            console.log("\nGoogle y NLU scores");
            console.log(googleScores);
            console.log(nluScores);
            console.log("\n");

            //Busco los maximos y minimos para cada uno
            let googleMaxMin = {"max":0,"min":0};
            let nluMaxMin = {"max":0,"min":0};
            googleMaxMin.max = getMaxOfArray(googleScores);
            googleMaxMin.min = getMinOfArray(googleScores);
            nluMaxMin.max = getMaxOfArray(nluScores);
            nluMaxMin.min = getMinOfArray(nluScores);
            console.log("Display google and nlu maxMin:");
            console.log(googleMaxMin);
            console.log(nluMaxMin);

            //Limpio cuando no trajo nada e imprimo antes de resizear
            combinedResults = combinedResults.filter(function(val) {
              return val.text !== undefined;
            });
            console.log("Data before resizing ----------> combinedResults:");
            console.log(combinedResults);

            //Hago el resizing con la formula y vuelvo a imprimir resultados
            combinedResults= combinedResults.map(function(el){return {"text":el.text, "size": resize(el,nluMaxMin,googleMaxMin)}})
            console.log("\nData after resizing ----------> combinedResults:");
            console.log(combinedResults);
            drawCloud();
            resolve();

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

  // var color = d3.scale.linear()
  // .domain([0,1,2,3,4,5,6,10,15,20,100])
  // .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]);

  var color = d3.scale.ordinal().range(["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854"]);

  d3.layout.cloud().size([800, 300])
    .words(combinedResults)
    .rotate(function() { return ~~(Math.random() * 2) * 45; })
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

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
  return Math.min.apply(null, numArray);
}

function resize(el,nluMaxMin,googleMaxMin){
  // return ((nluMaxMin.max-nluMaxMin.min)/(googleMaxMin.max-googleMaxMin.min))*Math.tanh(x-((googleMaxMin.max-googleMaxMin.min)/2))+(nluMaxMin.max-nluMaxMin.min)/2;
  if(el.origin === "google") return googleResize(el.size,googleMaxMin);
  if(el.origin === "nlu") return nluResize(el.size);
}

let nluResize = x => {return (60/18)*x+20};
let googleResize = (x,googleMaxMin) => {return (60/(googleMaxMin.max-googleMaxMin.min))*x+20};
