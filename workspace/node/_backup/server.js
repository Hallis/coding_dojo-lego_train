// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var gpio       = require('rpi-gpio');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Request: '+req.url);
    next(); // make sure we go to the next routes and don't stop here
});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ usage: 'train/{channel}/speed/{-7 to 7} | train/{channel}/stop' });
});

// more routes for our API will happen here


/**
API:
/train/{channel}/speed/{-7 to 7}
/train/{channel}/stop

channel = 2B|1B|2R|1R

*/

router.route('/train/:channel/speed/:speed')

    .get(function(req, res) {
	//console.log('/train/'+req.params.channel+'/speed/'+req.params.speed);

	var speed = req.params.speed;
	var channel = req.params.channel;


	//Check input
	if( isIncorrectChannel(channel) ){
	    console.log('Not a valid channel! ('+channel+')');
	    res.json({error: 'Not a valid channel ('+channel+')'});
	    return;
	}

	if( isIncorrectSpeed(speed) ) {
	    console.log('Not a valid speed! ('+speed+')');
	    res.json({error: 'Not a valid speed ('+speed+')'});
	    return;
	}

	//Prepapare command
	var reverseInstruction = null;
	var speedInstruction = null;
	if(speed >= 0){
	    reverseInstruction = '';
	    speedInstruction = speed;
	} else {
	    reverseInstruction = 'M';
	    speedInstruction = Math.abs(speed);
	}

	//Send command
	var apa=channel+'_'+reverseInstruction+speedInstruction;
	console.log('calling: irsend SEND_ONCE LEGO_Single_Output ' + apa);

	ir_send(apa, function(){
	  console.log('Train speed set to '+speed);
	});

	//Send response
	res.json({message: 'Train speed set to '+speed});
    });


router.route('/train/:channel/stop')

    .get(function(req, res) {

	var channel = req.params.channel;

	//Check input
	if( isIncorrectChannel(channel) ){
	    console.log('Not a valid channel! ('+channel+')');
	    res.json({error: 'Not a valid channel ('+channel+')'});
	    return;
	}

	//Send command
	console.log('calling: irsend SEND_ONCE LEGO_Single_Output '+channel+'_BRAKE');

	ir_send(channel+'_BRAKE', function(){
	      console.log('Train stopped');
	      });

	res.json({message: 'Train stopped'});
    });



router.route('/switch')
    .get(function(req, res) {
	var stepPinForward=23;
	var stepPinReverse=24;
	var powerPin=25;
	var motorPower=60;

	console.log('Växla!');

	res.json({message: 'Switch toggled'});
    });




// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

gpio.on('change', function(channel, value) {
    console.log('Channel ' + channel + ' value is now ' + value);
});
// gpio20 = pin 38
// gpio21 = pin 40
gpio.setup(38, gpio.DIR_IN, gpio.EDGE_BOTH);
gpio.setup(40, gpio.DIR_IN, gpio.EDGE_BOTH);


// HELPER FUNCTIONS
// =============================================================================
/*
function run_cmd(cmd, args, cb){
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var me = this;
    child.stdout.on('data', function(data){
	cb(me, data);
    });
}
*/

function ir_send(arg, cb){
    var cmd = 'irsend';
    var args = ['SEND_ONCE', 'LEGO_Single_Output', arg];
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var me = this;

    child.stdout.on('data', function(data){
	cb(me, data);
    });
}

function isIncorrectChannel(channel){
    var validChannels = ['1B','2B','1R','2R'];
    return ! validChannels.includes(channel);
}

function isIncorrectSpeed(speed){
    var result = true;
    speed = Number.parseInt(speed);
    if(Number.isInteger(speed) && speed >= -7 && speed <= 7 ){
	result = false;
    }
    //console.log('isIncorrectSpeed returning '+result);
    return result;
}
