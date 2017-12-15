

const fs = require('fs');
const _ = require('lodash');
const EventEmitter = require('events');
const util = require('./util');
const Parser = require('./parser');


const log = console.log ? console.log : process.stdout.write;

const DEBUG = process.env.DEBUG || 1;

class Mavlink extends EventEmitter {
    constructor(systemId, componentId, version, definitions) {
        super()

        this.version = version === "v0.9" || version === 0.9 ? "v0.9" : "v1.0";
        this.definitions = Array.isArray(definitions) ? definitions : ['common'];
        this.systemId = Number.isInteger(systemId) ? systemId : 0;
        this.componentId = Number.isInteger(componentId) ? componentId : 0;

        // Load definitions from definitions dir
        const defDir = `${__dirname}/../definitions/${this.version}`;
        let { enumTypes, messageTypes } = util.loadDefinitions(defDir, this.definitions);

        // Append checksum seeds to messageTypes
        messageTypes = _.map(messageTypes, (messageType) => {
            messageType.checksum = util.calcMessageTypeChecksum(messageType);
            return messageType;
        });

        this.parser = new Parser(this.startCharacter);

        // Key types by id and name for lookups
        this.messageTypesById = _.keyBy(messageTypes, 'id');
        this.messageTypesByName = _.keyBy(messageTypes, 'name');
        this.enumTypesByName = _.keyBy(enumTypes, 'name');

        // Send message state
        this.currentSequenceNum = 0;
        this.totalPacketsSent = 0;
        this.totalBytesSent = 0;

        // Receive message state
        this.lastSeenSequenceNum = 0;
        this.totalPacketsReceived = 0;
        this.totalBytesReceieved = 0;
        this.totalReceiveErrors = 0;

        // Receive buffer state
        // Maximum packet length is 263 bytes with full payload
        //this.buffer = Buffer.alloc(263, 0, 'utf8');
        //this.bufferIndex = 0;
        //this.messageLength = 0;
        // Array to store messages for out of order recovery
        this.messageStore = Array(20);

        // Track sequence numbers
        this.lastSeenSequenceNum = null;
        this.expectedSequenceNum = null;

        this.startupTime = Date.now();
    }

    get startCharacter() {
        if (this.version == "v1.0") {
              return 0xFE;
        } else if (this.version == "v0.9") {
              return 0x55;
        }
    }

    getMessageTypeById(messageId) {
        // use lodash instead
        if (this.messageTypesById.hasOwnProperty(messageId)) {

        }
    }

    parseBuffer(buffer) {

        const decoder = this.decodeMessage();
        decoder.next()
        this.parser.parseMessage(buffer, decoder);

        // chain parser to decoder
        //const messages = [...this.parser.parse(buffer)];

        // validate

        // decoder

        // console.log(messages[2])
        // console.log(this.decodeMessage(messages[2]))

        // const id = 25
        // //console.log(messages[id]);
        // console.log((this.messageTypesById[messages[id].messageId]).name);
        // console.log(messages[id]);
        //
        // console.log(this.decodeMessage(messages[id]))
        //var genParser = this.parser.parse(buffer);

        // yeids messages as they are parsed
    }

    * decodeMessage() {
        //console.log("hello")
        // accepts a message, and a message type definition
        while(true) {
            //console.log("before yeild")
            let message = yield;
            //console.log("after yeild");

        console.log(message)

        const msgPayloadLength = message.payloadLength;
        const msgType = this.messageTypesById[message.messageId];

        if (msgType === undefined) {
            continue;
        }
        // TODO: throw error if we do not have message type

        // Verify that sequence nums are monotonically increasing
        if (message.sequenceNum < this.lastSeenSequenceNum) {
            console.log("bad sequence number, expected greater than " + this.lastSeenSequenceNum + " got " + message.sequenceNum);

            // TODO: setting: ignoreOutofSequencePackets
            // exit decode
        }

        this.lastSeenSequenceNum = message.sequenceNum;

        // Checksum computed over header and payload ignoring first byte
        const checksumBuffer = Buffer.alloc(msgPayloadLength + 5, 0, 'utf8');
        message.buffer.copy(checksumBuffer, 0, 1, msgPayloadLength + 6);

        let expectedChecksum = util.calcChecksum(checksumBuffer);

        // v1.0 requires checksum seed to protect against differing message type
        // fields between transmitter and receiver
        // see: TODO
        if (this.version == "v1.0") {
            expectedChecksum = util.calcChecksum([msgType.checksum], expectedChecksum);
        }

        // Compare checksums
        if (expectedChecksum !== message.checksum) {
            console.log("bad checksum, expected " + expectedChecksum + " got " + message.checksum);

            // TODO: ignoreBadPackets
            // exit decode
        }

        return;

        // this can be moved out
        // need message payload and message type fields from messageId

        // //determine the fields
        // const fields = msgType.field;
        //
        // //console.log(fields);
    	// //initialise the output object and buffer offset
    	// let values = new Object();
    	// let offset = 0;
        //
    	// //loop over fields
    	// for (let i = 0; i < fields.length; i++) {
    	// 	// determine if field is an array
    	// 	var fieldSplit = fields[i].type.replace("[", ":").replace("]", ":").split(":");
        //
    	// 	//determine field name
    	// 	var fieldTypeName = fieldSplit[0];
        //
    	// 	//if field is an array, initialise output array
    	// 	if (fieldSplit.length > 1) {
    	// 		values[fields[i].name] = new Array(fields[i].arrayLength);
    	// 	}
        //
    	// 	//loop over all elements in field and read from buffer
    	// 	for (let j = 0; j < fields[i].arrayLength; j++) {
    	// 		var val = 0;
    	// 		switch (fieldTypeName){
    	// 			case 'float':
    	// 				val = message.payload.readFloatLE(offset);
    	// 				break;
    	// 			case 'double':
    	// 				val = message.payload.readDoubleLE(offset);
    	// 				break;
    	// 			case 'char':
    	// 				val = message.payload.readUInt8(offset);
        //                 console.log(val)
        //                 console.log(String.fromCharCode(val))
        //                 //console.log(String.fromCharCode(val))
    	// 				break;
    	// 			case 'int8_t':
    	// 				val = message.payload.readInt8(offset);
    	// 				break;
    	// 			case 'uint8_t':
    	// 				val = message.payload.readUInt8(offset);
    	// 				break;
    	// 			case 'uint8_t_mavlink_version':
    	// 				val = message.payload.readUInt8(offset);
    	// 				break;
    	// 			case 'int16_t':
    	// 				val = message.payload.readInt16LE(offset);
    	// 				break;
    	// 			case 'uint16_t':
    	// 				val = message.payload.readUInt16LE(offset);
    	// 				break;
    	// 			case 'int32_t':
    	// 				val = message.payload.readInt32LE(offset);
    	// 				break;
    	// 			case 'uint32_t':
    	// 				val = message.payload.readUInt32LE(offset);
    	// 				break;
        //
    	// 			//TODO: Add support for the 64bit types
    	// 			case 'int64_t':
    	// 				console.warn("No 64-bit Integer support yet!");
    	// 				//buf.writeFloatLE(value[i],offset);
    	// 				break;
    	// 			case 'uint64_t':
    	// 				//console.warn("No 64-bit Unsigned Integer support yet!");
    	// 				var val1 = message.payload.readUInt32LE(offset);
    	// 				var val2 = message.payload.readUInt32LE(offset+4);
    	// 				val = (val1<<32) + (val2);
    	// 				break;
    	// 		}
        //
    	// 		//increment offset by field type size
    	// 		offset += fields[i].typeLength;
        //
    	// 		//if field is an array, output in to array
    	// 		if (fieldSplit.length > 1) {
    	// 			values[fields[i].name][j] =  val;
    	// 		} else {
    	// 			values[fields[i].name] = val;
    	// 		}
    	// 	}
        //
        //     //reconstruct char arrays in to strings
    	// 	if (fieldSplit.length > 1 && fieldTypeName == 'char') {
    	// 		values[fields[i].name] = (new Buffer(values[fields[i].name])).toString();
    	// 	}
    	// }
        //
        // return values;
    }
}



};


//Allow look-up of message IDs by name
Mavlink.prototype._getMessageID = function(name) {
	if (this.messagesByName[name] !== undefined) {
		return this.messagesByName[name].$.id;
	}
	return -1;
}




//Allow look-up of message name from ID
Mavlink.prototype._getMessageName = function(id) {
	if (this.messagesByID[id] !== undefined) {
		return this.messagesByID[id].$.name;
	}
	return "";
}


//Decode an incomming message in to its individual fields
// Mavlink.prototype.decodeMessage = function(message) {
//
// 	//determine the fields
//     const fields = this.messageTypesById[message.id].field;
//
// 	//initialise the output object and buffer offset
// 	let values = new Object();
// 	let offset = 0;
//
// 	//loop over fields
// 	for (let i = 0; i < fields.length; i++) {
// 		// determine if field is an array
// 		var fieldSplit = fields[i].type.replace("[", ":").replace("]", ":").split(":");
//
// 		//determine field name
// 		var fieldTypeName = fieldSplit[0];
//
// 		//if field is an array, initialise output array
// 		if (fieldSplit.length > 1) {
// 			values[fields[i].name] = new Array(fields[i].arrayLength);
// 		}
//
// 		//loop over all elements in field and read from buffer
// 		for (let j = 0; j < fields[i].arrayLength; j++) {
// 			var val = 0;
// 			switch (fieldTypeName){
// 				case 'float':
// 					val = message.payload.readFloatLE(offset);
// 					break;
// 				case 'double':
// 					val = message.payload.readDoubleLE(offset);
// 					break;
// 				case 'char':
// 					val = message.payload.readUInt8(offset);
// 					break;
// 				case 'int8_t':
// 					val = message.payload.readInt8(offset);
// 					break;
// 				case 'uint8_t':
// 					val = message.payload.readUInt8(offset);
// 					break;
// 				case 'uint8_t_mavlink_version':
// 					val = message.payload.readUInt8(offset);
// 					break;
// 				case 'int16_t':
// 					val = message.payload.readInt16LE(offset);
// 					break;
// 				case 'uint16_t':
// 					val = message.payload.readUInt16LE(offset);
// 					break;
// 				case 'int32_t':
// 					val = message.payload.readInt32LE(offset);
// 					break;
// 				case 'uint32_t':
// 					val = message.payload.readUInt32LE(offset);
// 					break;
//
// 				//TODO: Add support for the 64bit types
// 				case 'int64_t':
// 					console.warn("No 64-bit Integer support yet!");
// 					//buf.writeFloatLE(value[i],offset);
// 					break;
// 				case 'uint64_t':
// 					//console.warn("No 64-bit Unsigned Integer support yet!");
// 					var val1 = message.payload.readUInt32LE(offset);
// 					var val2 = message.payload.readUInt32LE(offset+4);
// 					val = (val1<<32) + (val2);
// 					break;
// 			}
//
// 			//increment offset by field type size
// 			offset += fields[i].typeLength;
//
// 			//if field is an array, output in to array
// 			if (fieldSplit.length > 1) {
// 				values[fields[i].name][j] =  val;
// 			} else {
// 				values[fields[i].name] = val;
// 			}
// 		}
//
//         //reconstruct char arrays in to strings
// 		if (fieldSplit.length > 1 && fieldTypeName == 'char') {
// 			values[fields[i].name] = (new Buffer(values[fields[i].name])).toString();
// 		}
// 	}
//
//     return values;
// }


//
// // Test the checksum
// if (util.getChecksum(checksumBuffer) !== this.buffer.readUInt16LE(this.messageLength + 6)) {
//     // Corrupted or invalid message
//     this.reset();
//     return;
// }

//If checksum is good but sequence is screwed, fire off an event
// if (this.buffer[2] > 0 && this.buffer[2] - this.lastCounter != 1) {
// 	//this.emit("sequenceError", this.buffer[2] - this.lastCounter - 1);
// 	this.reset();
// 	return;
// }

// const message = new mavlinkMessage(this.buffer);
// //const decodedMessage = decodeMessage(message);
//  // can now call decode with messsage
//
//
// // 	//if system and component ID's dont match, ignore message. Alternatively if zeros were specified we return everything.
// // 	if ((this.sysid == 0 && this.compid == 0) || (message.system == this.sysid && message.component == this.compid)) {
// // 		//fire an event with the message data
// // 		this.emit("message", message);
// //
// // 		//fire additional event for specific message type
// // 		this.emit(this.getMessageName(this.buffer[5]), message, this.decodeMessage(message));
// // 	}
// // } else {
// // 	//If checksum fails, fire an event with some debugging information. Message ID, Message Checksum (XML), Calculated Checksum, Received Checksum
// // 	this.emit("checksumFail", this.buffer[5], this.messageChecksums[this.buffer[5]], this.calculateChecksum(crc_buf), this.buffer.readUInt16LE(this.messageLength+6));
// // }
//
// //We got a message, so reset things
// this.reset();
// return message;
//



module.exports = Mavlink;
