

const _ = require('lodash');
const MavlinkMessage = require('./message');

const MAVLINK_FRAMING_INCOMPLETE = 0;

const MAVLINK_PARSE_STATE_UNINIT = 'UNINIT';
const MAVLINK_PARSE_STATE_IDLE = 'IDLE';
const MAVLINK_PARSE_STATE_GOT_STX = 'GOT_STX';
const MAVLINK_PARSE_STATE_GOT_LENGTH = 'GOT_LENGTH';
const MAVLINK_PARSE_STATE_GOT_SEQ = 'GOT_SEQ';
const MAVLINK_PARSE_STATE_GOT_SYSID = 'GOT_SYSID';
const MAVLINK_PARSE_STATE_GOT_COMPID = 'GOT_COMPID';
const MAVLINK_PARSE_STATE_GOT_MSGID = 'GOT_MSGID';
const MAVLINK_PARSE_STATE_GOT_PAYLOAD = 'GOT_PAYLOAD'



const MAVLINK_MAX_PAYLOAD_LENGTH = 255;
const MAVLINK_MAX_PACKET_LENGTH = 263;

const MAVLINK_STX = 0xFE;


class MavlinkParser {
    constructor() {
        //this.startCharacter = startCharacter;

        // Receive message buffer
        // Maximum package length is 263 bytes with full payload
        //this.buffer = Buffer.alloc(MAVLINK_MAX_PAYLOAD_LENGTH, 0, 'utf8');


        // Index into buffer
        this.bufferIndex = 0;

        // this.statusMsgReceived = MAVLINK_FRAMING_INCOMPLETE;
        //
        // this.statusParseState = MAVLINK_PARSE_STATE_UNINIT;
        //
        // this.statusBufferOverrun = 0;
        // this.statusParseError = 0;

        // Expected payload length
        //this.payloadLength = 0;

        //this.magic = null;

        this.status = {
            msgReceived: MAVLINK_FRAMING_INCOMPLETE,
            parseState: MAVLINK_PARSE_STATE_UNINIT,
            packetIdx: 0,
            bufferOverrun: 0,
            parseError: 0
        }

        this.msg = {
            magic: null,
            payloadLength: null,
            sequenceNum: null,
            systemId: null,
            componentId: null,
            messageId: null,
            payload: Buffer.alloc(MAVLINK_MAX_PAYLOAD_LENGTH, 0, 'utf8')
        }
    }

    // parse message and execute decoder
    // parseMessage(buffer, decoder) {
    //     let msg = null;
    //     _.each(buffer, ch => {
    //         msg = this._parseChar(ch);
    //         if (msg instanceof MavlinkMessage) {
    //             //console.log("sending message")
    //             decoder.next(msg);
    //         }
    //     });
    //     //console.log("done")
    //     decoder.return();
    // }

    // parse message and execute decoder
    parseMessage(buffer) {
        console.log("parse message");
        let msg = null;
        _.each(buffer, ch => {
            this._parseChar(ch);
            //
            // if (msg instanceof MavlinkMessage) {
            //     //console.log("sending message")
            //     decoder.next(msg);
            // }
        });
        //console.log("done")
        //decoder.return();
    }

    _parseChar(ch) {

        switch(this.status.parseState) {

            case MAVLINK_PARSE_STATE_UNINIT:
            case MAVLINK_PARSE_STATE_IDLE:
                console.log("idle state")
                console.log(this)
                if (ch == MAVLINK_STX) {
                    this.msg.payloadLength = null; // reset
                    this.msg.magic = ch;
                    this.status.parseState = MAVLINK_PARSE_STATE_GOT_STX;
                }

                break;

            case MAVLINK_PARSE_STATE_GOT_STX:
                console.log("stx state")
                console.log(this)
                //if (this.statusMsgReceived || ch > MAVLINK_MAX_PAYLOAD_LENGTH) {
                if (ch > MAVLINK_MAX_PAYLOAD_LENGTH) {
                    this.status.bufferOverrun++;
                    this.status.parseError++;
                    this.status.msgReceived = 0;
                    this.status.parseState = MAVLINK_PARSE_STATE_IDLE;
                }
                else {
                    this.msg.payloadLength = ch;
                    this.status.packetIdx = 0;
                    this.status.parseState = MAVLINK_PARSE_STATE_GOT_LENGTH;
                }

                break;

            case MAVLINK_PARSE_STATE_GOT_LENGTH:
                console.log("length state")
                console.log(this);
                this.msg.sequenceNum = ch;
                this.status.parseState = MAVLINK_PARSE_STATE_GOT_SEQ;
                break;

            case MAVLINK_PARSE_STATE_GOT_SEQ:
                console.log("seq state")
                console.log(this);
                this.msg.systemId = ch;
                this.status.parseState = MAVLINK_PARSE_STATE_GOT_SYSID;
                break;

            case MAVLINK_PARSE_STATE_GOT_SYSID:
                console.log("sysid state")
                console.log(this);
                this.msg.componentId = ch;
                this.status.parseState = MAVLINK_PARSE_STATE_GOT_COMPID;
                break;

            case MAVLINK_PARSE_STATE_GOT_COMPID:
                console.log("compid state")
                console.log(this);
                // can check message length for componentId

                this.msg.messageId = ch;

                if (this.msg.payloadLength == 0) {
                    this.status.parseState = MAVLINK_PARSE_STATE_GOT_PAYLOAD;
                }
                else {
                    this.status.parseState = MAVLINK_PARSE_STATE_GOT_MSGID;
                }

                break;

            case MAVLINK_PARSE_STATE_GOT_MSGID:
                console.log("msgid state");
                console.log(this);
                //this.bufferIndex++;
                this.msg.payload[this.status.packetIdx++] = ch;



                if (this.status.packetIdx == this.msg.payloadLength) {
                    this.status.parseState = MAVLINK_PARSE_STATE_GOT_PAYLOAD;
                }

                break;

            case MAVLINK_PARSE_STATE_GOT_PAYLOAD:
                console.log("got payload state")
                console.log(this);

                this.status.msgReceived = 1;
                this.status.parseState = MAVLINK_PARSE_STATE_IDLE;
                break;

            default:
                console.log("in default case")
                console.log(this);
                break;

        }

        this.bufferIndex++;

        //
        // // Look for start of packet
        // if (this.bufferIndex == 0 && ch == this.startCharacter) {
        //     this.buffer[this.bufferIndex] = ch;
        //     this.bufferIndex++;
        //     return;
        // }
        //
        // // Determine packet length
        // if (this.bufferIndex == 1) {
        //     this.buffer[this.bufferIndex] = ch;
        //     this.payloadLength = parseInt(ch);
        //     this.bufferIndex++;
        //     return;
        // }
        //
        // // Receive everything else
        // if (this.bufferIndex > 1 && this.bufferIndex < this.payloadLength + 8) {
        //     this.buffer[this.bufferIndex] = ch;
        //     this.bufferIndex++;
        //     return;
        // }
        //
        // // If end of packet, return the message
        // if (this.bufferIndex == this.payloadLength + 8) {
        //     this.bufferIndex = 0;
        //     this.payloadLength = 0;
        //     return new MavlinkMessage(this.buffer);
        // }
    }
};

//
// MAVLINK_HELPER uint8_t mavlink_frame_char_buffer(mavlink_message_t* rxmsg,
//                                                  mavlink_status_t* status,
//                                                  uint8_t c,
//                                                  mavlink_message_t* r_message,
//                                                  mavlink_status_t* r_mavlink_status)
// {
//         /*
// 	  default message crc function. You can override this per-system to
// 	  put this data in a different memory segment
// 	*/
// #if MAVLINK_CRC_EXTRA
// #ifndef MAVLINK_MESSAGE_CRC
// 	static const uint8_t mavlink_message_crcs[256] = MAVLINK_MESSAGE_CRCS;
// #define MAVLINK_MESSAGE_CRC(msgid) mavlink_message_crcs[msgid]
// #endif
// #endif
//
// 	/* Enable this option to check the length of each message.
// 	   This allows invalid messages to be caught much sooner. Use if the transmission
// 	   medium is prone to missing (or extra) characters (e.g. a radio that fades in
// 	   and out). Only use if the channel will only contain messages types listed in
// 	   the headers.
// 	*/
// #ifdef MAVLINK_CHECK_MESSAGE_LENGTH
// #ifndef MAVLINK_MESSAGE_LENGTH
// 	static const uint8_t mavlink_message_lengths[256] = MAVLINK_MESSAGE_LENGTHS;
// #define MAVLINK_MESSAGE_LENGTH(msgid) mavlink_message_lengths[msgid]
// #endif
// #endif
//
// 	int bufferIndex = 0;
//
// 	status->msg_received = MAVLINK_FRAMING_INCOMPLETE;
//
// 	switch (status->parse_state)
// 	{
// 	case MAVLINK_PARSE_STATE_UNINIT:
// 	case MAVLINK_PARSE_STATE_IDLE:
// 		if (c == MAVLINK_STX)
// 		{
// 			status->parse_state = MAVLINK_PARSE_STATE_GOT_STX;
// 			rxmsg->len = 0;
// 			rxmsg->magic = c;
// 			mavlink_start_checksum(rxmsg);
// 		}
// 		break;
//
// 	case MAVLINK_PARSE_STATE_GOT_STX:
// 			if (status->msg_received
// /* Support shorter buffers than the
//    default maximum packet size */
// #if (MAVLINK_MAX_PAYLOAD_LEN < 255)
// 				|| c > MAVLINK_MAX_PAYLOAD_LEN
// #endif
// 				)
// 		{
// 			status->buffer_overrun++;
// 			status->parse_error++;
// 			status->msg_received = 0;
// 			status->parse_state = MAVLINK_PARSE_STATE_IDLE;
// 		}
// 		else
// 		{
// 			// NOT counting STX, LENGTH, SEQ, SYSID, COMPID, MSGID, CRC1 and CRC2
// 			rxmsg->len = c;
// 			status->packet_idx = 0;
// 			mavlink_update_checksum(rxmsg, c);
// 			status->parse_state = MAVLINK_PARSE_STATE_GOT_LENGTH;
// 		}
// 		break;
//
// 	case MAVLINK_PARSE_STATE_GOT_LENGTH:
// 		rxmsg->seq = c;
// 		mavlink_update_checksum(rxmsg, c);
// 		status->parse_state = MAVLINK_PARSE_STATE_GOT_SEQ;
// 		break;
//
// 	case MAVLINK_PARSE_STATE_GOT_SEQ:
// 		rxmsg->sysid = c;
// 		mavlink_update_checksum(rxmsg, c);
// 		status->parse_state = MAVLINK_PARSE_STATE_GOT_SYSID;
// 		break;
//
// 	case MAVLINK_PARSE_STATE_GOT_SYSID:
// 		rxmsg->compid = c;
// 		mavlink_update_checksum(rxmsg, c);
// 		status->parse_state = MAVLINK_PARSE_STATE_GOT_COMPID;
// 		break;
//
// 	case MAVLINK_PARSE_STATE_GOT_COMPID:
// #ifdef MAVLINK_CHECK_MESSAGE_LENGTH
// 	        if (rxmsg->len != MAVLINK_MESSAGE_LENGTH(c))
// 		{
// 			status->parse_error++;
// 			status->parse_state = MAVLINK_PARSE_STATE_IDLE;
// 			break;
// 	    }
// #endif
// 		rxmsg->msgid = c;
// 		mavlink_update_checksum(rxmsg, c);
// 		if (rxmsg->len == 0)
// 		{
// 			status->parse_state = MAVLINK_PARSE_STATE_GOT_PAYLOAD;
// 		}
// 		else
// 		{
// 			status->parse_state = MAVLINK_PARSE_STATE_GOT_MSGID;
// 		}
// 		break;
//
// 	case MAVLINK_PARSE_STATE_GOT_MSGID:
// 		_MAV_PAYLOAD_NON_CONST(rxmsg)[status->packet_idx++] = (char)c;
// 		mavlink_update_checksum(rxmsg, c);
// 		if (status->packet_idx == rxmsg->len)
// 		{
// 			status->parse_state = MAVLINK_PARSE_STATE_GOT_PAYLOAD;
// 		}
// 		break;
//
// 	case MAVLINK_PARSE_STATE_GOT_PAYLOAD:
// #if MAVLINK_CRC_EXTRA
// 		mavlink_update_checksum(rxmsg, MAVLINK_MESSAGE_CRC(rxmsg->msgid));
// #endif
// 		if (c != (rxmsg->checksum & 0xFF)) {
// 			status->parse_state = MAVLINK_PARSE_STATE_GOT_BAD_CRC1;
// 		} else {
// 			status->parse_state = MAVLINK_PARSE_STATE_GOT_CRC1;
// 		}
//                 _MAV_PAYLOAD_NON_CONST(rxmsg)[status->packet_idx] = (char)c;
// 		break;
//
// 	case MAVLINK_PARSE_STATE_GOT_CRC1:
// 	case MAVLINK_PARSE_STATE_GOT_BAD_CRC1:
// 		if (status->parse_state == MAVLINK_PARSE_STATE_GOT_BAD_CRC1 || c != (rxmsg->checksum >> 8)) {
// 			// got a bad CRC message
// 			status->msg_received = MAVLINK_FRAMING_BAD_CRC;
// 		} else {
// 			// Successfully got message
// 			status->msg_received = MAVLINK_FRAMING_OK;
//                 }
//                 status->parse_state = MAVLINK_PARSE_STATE_IDLE;
//                 _MAV_PAYLOAD_NON_CONST(rxmsg)[status->packet_idx+1] = (char)c;
//                 memcpy(r_message, rxmsg, sizeof(mavlink_message_t));
// 		break;
// 	}
//
// 	bufferIndex++;
// 	// If a message has been sucessfully decoded, check index
// 	if (status->msg_received == MAVLINK_FRAMING_OK)
// 	{
// 		//while(status->current_seq != rxmsg->seq)
// 		//{
// 		//	status->packet_rx_drop_count++;
// 		//               status->current_seq++;
// 		//}
// 		status->current_rx_seq = rxmsg->seq;
// 		// Initial condition: If no packet has been received so far, drop count is undefined
// 		if (status->packet_rx_success_count == 0) status->packet_rx_drop_count = 0;
// 		// Count this packet as received
// 		status->packet_rx_success_count++;
// 	}
//
// 	r_message->len = rxmsg->len; // Provide visibility on how far we are into current msg
// 	r_mavlink_status->parse_state = status->parse_state;
// 	r_mavlink_status->packet_idx = status->packet_idx;
// 	r_mavlink_status->current_rx_seq = status->current_rx_seq+1;
// 	r_mavlink_status->packet_rx_success_count = status->packet_rx_success_count;
// 	r_mavlink_status->packet_rx_drop_count = status->parse_error;
// 	status->parse_error = 0;
//
// 	if (status->msg_received == MAVLINK_FRAMING_BAD_CRC) {
// 		/*
// 		  the CRC came out wrong. We now need to overwrite the
// 		  msg CRC with the one on the wire so that if the
// 		  caller decides to forward the message anyway that
// 		  mavlink_msg_to_send_buffer() won't overwrite the
// 		  checksum
// 		 */
// 		r_message->checksum = _MAV_PAYLOAD(rxmsg)[status->packet_idx] | (_MAV_PAYLOAD(rxmsg)[status->packet_idx+1]<<8);
// 	}
//
// 	return status->msg_received;

module.exports = MavlinkParser;
