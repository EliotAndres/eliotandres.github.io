var app = angular.module('app', []);

app
    .controller('MainController', function MainController($scope, $timeout, $http) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.audioContext = null;
        $scope.muted = true

        $scope.initAudio = function () {
            console.log('init audio')
            window.audioContext = new AudioContext();
            $scope.gainNode = window.audioContext.createGain();
            $scope.gainNode.gain.value = 1;
            $scope.gainNode.connect(window.audioContext.destination);
        }

        $scope.search = '';
        $scope.messages = [];

        $scope.listenToSpeech = function() {
            if (typeof webkitSpeechRecognition === 'undefined') {
                return alert('Oops :-( Speech recognition is only available using Chrome')
            }

            var recognition = new webkitSpeechRecognition();
            recognition.lang = "en-US";

            recognition.onresult = function(event) {
                var transcript = event.results[event.results.length - 1][0].transcript;
                console.log(transcript)
                sendToChatbot(transcript)

            }

            recognition.start();
            $scope.listening = true

            recognition.onend = function(){
                console.log('Speech recognition ended')
                $timeout(function () {
                    $scope.listening = false
                }, 0)
            }
        }

        $scope.submit = function () {
            sendToChatbot($scope.search)
        }

        window.toggleMute = function (e) {
            console.log('toggle mute')
            if (window.audioContext === null) {
                $scope.initAudio()
            }

            $timeout(function () {
                if ($scope.muted) {
                    window.audioContext.resume()
                    $scope.gainNode.gain.value = 1;
                } else {
                    $scope.gainNode.gain.value = 0;
                }
                $scope.muted = !$scope.muted
            }, 0)

        }

        var scrollToBottom = function () {
            var objDiv = document.getElementById('message-list');
            setTimeout(function () {
                objDiv.scrollTop = objDiv.scrollHeight;
            }, 100);
        }

        var sendToChatbot = function(text) {
            $scope.messages.push({title: text, question: true})
            scrollToBottom()
            $http({
                method: 'GET',
                url: 'https://us-central1-job-interview-b2b48.cloudfunctions.net/helloWorld?text=' + text
            }).then(function successCallback(response) {
                console.log(response.data)
                playByteArray(response.data.outputAudio.data)
                var message = messageFromResponse(response.data)
                console.log(message)
                $timeout(function () {
                    $scope.messages.push(message)
                    scrollToBottom()
                }, 0)
            }, function errorCallback(error) {
                console.error(error);
            });
            $scope.search = '';
        };

        function messageFromResponse(response) {
            return {title: response.queryResult.fulfillmentMessages[0].text.text[0], isAnswer: true}
        }

        function playByteArray( bytes ) {
            var buffer = new Uint8Array( bytes.length );
            buffer.set( new Uint8Array(bytes), 0 );

            window.audioContext.decodeAudioData(buffer.buffer, play);
        }

        function play( audioBuffer ) {
            var source = window.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect($scope.gainNode);
            source.start(0);
        }




    });
