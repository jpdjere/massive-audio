var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

require('dotenv').config({silent: true});

// Your Google Cloud Platform project ID
const projectId = process.env.GCLOUD_PROJECT;

// The audio file's encoding, sample rate in hertz, and BCP-47 language code
const options = {
    //encoding: 'FLAC',
    //sampleRateHertz: 48000,
    maxAlternatives: 3,
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

// The name of the audio file to transcribe
//    const fileName = './resources/audio.raw';
    // const fileName = 'gs://eminent-augury-146415.appspot.com/leydetierras.flac';
    const fileName = 'gs://clarin-videos/leydetierras.flac';


// Detects speech in the audio file
    speechClient.startRecognition(fileName, options)
            .then((results) => {

            	const operation = results[0];
            	return operation.promise();
            })
            .then((results) => {
            	const transcription = results[0]
            	console.log(`Transcription: ${transcription}`);
            })
            .catch((err) => {
                console.error('ERROR:', err);
            });

});


module.exports = router;
