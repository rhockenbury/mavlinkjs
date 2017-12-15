


var fs = require('fs');
const SerialPort = require('serialport');

const FILE_NAME = './data/cleanflight.mavlink';
const PORT_NAME = '/dev/tty.usbserial-A1011RYO'

const stream = fs.createWriteStream(FILE_NAME);
const port = new SerialPort(PORT_NAME, { baudrate: 57600 });

port.on('open', () => {
    console.log("Serial port ready");
});

port.on('data', (data) => {
    stream.write(data);
});

port.on('error', (err) => {
    console.log('Serial port error: ', err.message);
});
