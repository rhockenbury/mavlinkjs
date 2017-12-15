


class MavlinkMessage {
    constructor(buf) {
        // Payload length
        this.payloadLength = buf[1];

        // Sequence number
        this.sequenceNum = buf[2];

        // System ID
        this.systemId = buf[3];

        // Component ID
        this.componentId = buf[4];

        // Message ID
        this.messageId = buf[5];

        // Message header buffer (first 6 bytes)
        this.header = Buffer.alloc(6, 0, 'utf8');
        buf.copy(this.header, 0, 0, 6);

        // Message payload buffer (payloadLength bytes starting after header)
        this.payload = Buffer.alloc(this.payloadLength, 0, 'utf8');
        buf.copy(this.payload, 0, 6, this.payloadLength + 6);

        // Checksum (last 2 bytes)
        this.checksum = buf.readUInt16LE(this.payloadLength + 6);

        // Whole message as a buffer
        this.buffer = Buffer.alloc(this.payloadLength + 8, 0, 'utf8');
        buf.copy(this.buffer, 0 , 0, this.payloadLength + 8);
    }
};

module.exports = MavlinkMessage;
