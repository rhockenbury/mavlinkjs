
const SerialPort = require('serialport');
const Mavlink = require('../lib');

const PORT_NAME = '/dev/tty.usbserial-A1011RYO'; //'/dev/tty.SLAB_USBtoUART';

SerialPort.list((data) => {
	console.log(data);
})

const mav = new Mavlink(0, 0); // same as new Mavlink(0, 0, "v1.0", ["common"])
const port = new SerialPort(PORT_NAME, {
    baudrate: 57600
});

// SerialPort.list((data) => {
// 	console.log(data);
// })

port.on('open', () => {
    console.log("Serial port ready");
});

port.on('data', (data) => {
	//console.log('received data')
	console.log(data);
	//mav.parseBuffer(data);
}); // stream data events to mavlink parser

port.on('error', (err) => {
    console.log('Serial port error: ', err.message);
});



//
//
// //When port is open, start up mavlink
// port.on('open', function() {
// 	console.log("Serial Port is ready");
//
// 	//listening for system 1 component 1
// 	var m = new mavlink(1,1); // this is now synchronous
//
//
//         port.on('data', (data) => {
//             let messages = [...parser.parse(data)];
//
//             // do something with messages
//         })
//
//         port.on('data', mav.parseBuffer);
//
// 		//Attitude listener
// 		m.on('ATTITUDE', function(message, fields) {
// 			//Do something interesting with Attitude data here
// 			console.log("Roll is " + fields.roll + "\nPitch is " + fields.pitch);
// 		});
//
//
// 		//Create a few messages and print them to screen
// 		m.createMessage("ATTITUDE", {
// 			'time_boot_ms':	30,
// 			'roll':			0.1,
// 			'pitch':		0.2,
// 			'yaw':			0.3,
// 			'rollspeed':	0.4,
// 			'pitchspeed':	0.5,
// 			'yawspeed':		0.6
// 		}, echoMessage);
//
// 		m.createMessage("PARAM_VALUE", {
// 			'param_id':		'MY_PI',
// 			'param_value':	3.14159,
// 			'param_type':	5,
// 			'param_count':	100,
// 			'param_index':	55
// 		}, echoMessage);
//
// 		m.createMessage("GPS_STATUS", {
// 			'satellites_visible':		5,
// 			'satellite_prn':			[1, 2, 3, 4, 5],
// 			'satellite_used':			[2, 3, 4, 5, 6],
// 			'satellite_elevation':		[3, 4, 5, 6, 7],
// 			'satellite_azimuth':		[4, 5, 6, 7, 8],
// 			'satellite_snr':			[5, 6, 7, 8, 9]
// 		}, echoMessage);
// 	//});
// });
//
// var echoMessage = function(message) {
// 	console.log(message);
