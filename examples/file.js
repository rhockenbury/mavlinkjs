
const fs = require('fs');
const Parser = require('../lib/parser');
//const message = require('../lib/message');
const mavlink = require('../lib/index')

// Read mavlink capture data
const serialStream = fs.readFileSync("./data/capture.mavlink");

const parser = new Parser();

parser.parseMessage(serialStream)

//console.log(parser);


//let genParser = parser.parse(serialStream)

//console.log(genParser);

//console.log(genParser.next());
//
//console.log(genParser.next());

//
//console.log(messages[0]);

//console.log(messages[1]);

// for (var i of parser.parse(serialStream)) {
//     console.log(i)
// }


// const mav = new mavlink(0,0);
// mav.parseBuffer(serialStream);

//console.log(mav)
