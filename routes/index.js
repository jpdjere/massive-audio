var express = require('express');
var router = express.Router();
var https = require('https');
var request = require('request');
var path = require('path');
var fs = require('fs');

var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
  username: '87785b96-9165-4d05-b0d3-c1c845464aa8',
  password: 'wqtO3URm1Kzx',
  version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

// Imports the Google Cloud client library
const Language = require('@google-cloud/language');
// Instantiates a client
const language = Language();



/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'index2.html'));
});

require('dotenv').config({silent: true});

// Your Google Cloud Platform project ID
const projectId = process.env.GCLOUD_PROJECT;

// The audio file's encoding, sample rate in hertz, and BCP-47 language code
const options = {
    // encoding: 'ogg',
    //sampleRateHertz: 48000,
    languageCode: 'es-AR'
};

const voiceAlice = {
    voice: 'alice',
    loop: "1",
    language: "es-ES"
};


/*
 * Prueba de google speech to text
 */
router.get('/api/google-speech-to-text', function (req, res) {//solo para pruebas individuales con google-speech-to-text

    // Imports the Google Cloud client library
    const Speech = require('@google-cloud/speech');

    // Instantiates a client
    const speechClient = Speech({
        projectId: projectId
    });

    const storage = require('@google-cloud/storage');
    const gcs = storage({
      projectId: projectId
    });

    let encoded_url_address = req.query.url_address;
    let unencoded_url_address = decodeURIComponent(encoded_url_address);
    // The name of the audio file to transcribe
    const fileName = 'gs://clarin-videos/audio.flac';
    /*
    let bucket_name = "clarin-videos";

    // let source_file_name = "";
    let destination_blob_name = "Audios/audiotest.flac"
    // let url_address = "https://www.youtube.com/watch?v=XBsdkAzB4qQ";
    let url_address = req.query.url_address;
    url_address = encodeURIComponent(url_address);
    console.log("url_address");
    console.log("url_address");
    console.log("url_address");
    console.log(url_address);

    let req_address = "http://cognitiva-video-converter.mybluemix.net/upload?bucket_name="+bucket_name+"&url_address="+encodeURIComponent(url_address);
    console.log(req_address);

    //Tiro mi video al servicio de Python para extraer audio, convertirlo y subirlo a GCS
    request
      // .get(req_address)
      .get(`https://127.0.0.1:5000/upload?bucket_name=${bucket_name}&url_address=${url_address}`)
      .on('error', function(err) {
        console.log(err);
      })
      .on('response', function(response) {
        console.log(response.statusCode) // 200
        console.log(response.headers['content-type']) // 'image/png'
        console.log(JSON.stringify(response,null,2));

        speechRecognition()
          .then(() => {
            console.log("Termino todo.");
          })
      })
      */

      let audioFileName = 'public/audios/audio-'+Date.now()+'.aac';
      // let audioFileName = 'public/audios/audio-upload.aac';
      const ytdl = require('ytdl-core');

      let extractAudio = (url) => {
        return new Promise(
          (resolve, reject) => {

            let youtube = ytdl(url,{
              filter: "audioonly"
            }).pipe(fs.createWriteStream(audioFileName));

            youtube.on('finish',function() {
              console.log("Finished extracting audio");
              resolve();
            })


          })

      }

      let convertAudio = () => {
        return new Promise(
          (resolve, reject) => {
            const ffmpeg = require('ffmpeg');
            try {
              var process = new ffmpeg(audioFileName);
              process.then(function (video) {
                // Callback mode
                video
                .setAudioCodec('flac')
                // .setAudioFrequency(48,function(error,file){
                .setAudioChannels(2)
                .save('public/audios/audio-upload.flac', function (error, file) {
                  if (!error)
                  console.log('Converted audio file: ' + file);
                  resolve();
                });
              }, function (err) {
                console.log('Error: ' + err);
                reject("Error on process");
              });
            } catch (e) {
              console.log(e.code);
              console.log(e.msg);
              reject("Error on try process");
            }
          })
      }

      let bucket = gcs.bucket('clarin-videos');
      let uploadGCS = () => {
        //Uploads the file
        bucket.upload('public/audios/audio-upload.flac', function(err, file) {
          if (!err) {
            console.log(`Uploaded ${file} to GCS`);

            // Makes the file public
            gcs
              .bucket('clarin-videos')
              .file('audio-upload.flac')
              .makePublic();

          }else{
            console.log("There was an error uploading the file");
            console.log(err);
          }

        });

      }


      extractAudio(unencoded_url_address)
        .then(() => {
          convertAudio()
            .then(() => {
              uploadGCS();
            })

        })
        .catch((e) => {
          console.log(e);
        })









    let googleNLUPromise = (text) => {
      return new Promise(
        (resolve, reject) => {

          // Instantiates a Document, representing the provided text
          const document = language.document({ content: text});// Detects entities in the document
          document.detectEntities()
            .then((results) => {
              const entities = results[1].entities;

              console.log('Entities:');
              console.log(entities);

              // entities.forEach((entity) => {
              //   console.log(entity.name);
              //   console.log(` - Type: ${entity.type}, Salience: ${entity.salience}`);
              //   if (entity.metadata && entity.metadata.wikipedia_url) {
              //     console.log(` - Wikipedia URL: ${entity.metadata.wikipedia_url}$`);
              //   }
              // });
              resolve(entities);
            })
            .catch((err) => {
              console.error('ERROR:', err);
            });

        }
      )
    }


    let watsonNLUPromise = (parameters) => {
      return new Promise(
        (resolve, reject) => {

          natural_language_understanding.analyze(parameters, function(err, response) {
            console.log(" ");
            console.log("Entre a NLU:");
            if (err){
              console.log('error:', err);
            }
            else{
              console.log(JSON.stringify(response, null, 2));
              resolve(response);
            }
          });

        }
      )
    }


    let speechRecognition = () => {
      console.log("entre a speech recognition");
      let analyzedText = {};
      return new Promise(
        (resolve, reject) => {

          // Detects speech in the audio file
          speechClient.startRecognition(fileName, options)
          .then((results) => {

            const operation = results[0];
            return operation.promise();
          })
          .then((results) => {
            const transcription = results[0]
            console.log(`Transcription: ${transcription}`);
            let parameters = {
              'text': transcription,
              'features': {
                'entities': {
                  'emotion': true,
                  'sentiment': false
                },
                'keywords': {
                  'emotion': true,
                  'sentiment': false
                },
                'concepts': {
                  'emotion': true,
                  'sentiment': false
                }
              }
            }
            googleNLUPromise(parameters.text)
              .then((results) => {
                analyzedText.google = results;
                console.log("Inside Google Promise:");
                console.log(analyzedText);
                watsonNLUPromise(parameters)
                .then((response) => {
                  analyzedText.watson = response;
                  console.log("Inside NLU Promise:");
                  console.log(analyzedText);
                  res.send(analyzedText);
                });
              })

          })
          .catch((err) => {
            console.error('ERROR:', err);
          });

        }
      )
    }




});


module.exports = router;
