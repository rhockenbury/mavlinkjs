// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at http://www.apache.org/licenses/LICENSE-2.0
// Copyright 2017 Ryler Hockenbury

const xmlParser = require('pixl-xml');
const _ = require('lodash');
var constants = require('./constants');


const splitFieldType = (fieldType) => {
    return String(fieldType).replace("[", ":").replace("]", ":").split(":");
}

/**
 * Determine the size of a fields data type
 * @param {Object} field -
 * @return {Integer}
 */
const getFieldTypeLength = (field) => {
    return constants.TYPE_LENGTHS[splitFieldType(field.type)[0]];
};

/**
 * Determine the size of a field
 * @param {Object} field -
 * @return {Integer}
 */
const getFieldLength = (field) => {
    const fieldSplit = field.type.replace("[", ":").replace("]", ":").split(":");
    let typeLength = getFieldTypeLength(field);

    // For each element after the type name (>1), multiply up
    for (let i = 1; i < fieldSplit.length; i++) {
        if (fieldSplit[i] != "") {
            typeLength *= fieldSplit[i];
        }
    }
    return typeLength;
};

/**
 * Sort message type fields
 * @param {Object} messageType -
 * @return {Object}
 */
const sortFields = (messageType) => {
    messageType.payloadLength = 0; // Track total expected payload length

    for (let i = 0; i < messageType.field.length; i++) {
        // Add initial position to preserve order if size is same amoung fields
        messageType.field[i].initialPos = i;

        // Change a few types
        if (messageType.field[i].type == 'uint8_t_mavlink_version') {
            messageType.field[i].type = 'uint8_t';
        }

        if (messageType.field[i].type == 'array') {
            messageType.field[i].type = 'int8_t';
        }

        // Calculate some useful lengths
        messageType.field[i].length = getFieldLength(messageType.field[i]);
        messageType.field[i].typeLength = getFieldTypeLength(messageType.field[i]);
        messageType.field[i].arrayLength = messageType.field[i].length / messageType.field[i].typeLength;
        messageType.payloadLength += messageType.field[i].length;
    }

    if (!Array.isArray(messageType.field)) {
        return messageType;
    }

    // Sort fields by type length
    messageType.field.sort(function(a, b){
        const lenA = a.typeLength;
        const lenB = b.typeLength;

        // If lengths are equal, preserve initial ordering
        if (lenA == lenB) {
            return a.initialPos - b.initialPos;
        }
        // Otherwise reverse sort on size
        else {
            return lenB - lenA;
        }
    })

    return messageType;
};

/**
 * Implementation of X25 checksum
 * @param {Object} buffer -
 * @return {String}
 */
const calcChecksum = (buffer, crc) => {
    crc = crc || 0xffff;
    let tmp = null;
    _.each(buffer, b => {
        tmp = b ^ (crc & 0xff);
        tmp = (tmp ^ (tmp << 4)) & 0xFF;
        crc = (crc >> 8) ^ ( tmp << 8) ^ (tmp << 3) ^ ( tmp >> 4);
        crc = crc & 0xFFFF;
    })
    return crc;
};

/**
 * Calculate a 8-bit checksum of the key fields of a
 * message type to detect incompatible XML changes
 * @param {Object} messageType -
 * @return {String}
 */
const calcMessageTypeChecksum = (messageType) => {
    messageType = sortFields(messageType);

    let type = null;
    let checksumString = messageType.name + " ";

    for (let i = 0; i < messageType.field.length; i++) {
        type = messageType.field[i].type.replace("[", ":").replace("]", ":").split(":");
        checksumString += type[0] + " ";
        checksumString += messageType.field[i].name + " ";
        if (type[1] !== undefined) {
            checksumString += String.fromCharCode(type[1]);
        }
    }

    checksumString = calcChecksum(new Buffer(checksumString));
    return (checksumString & 0xFF) ^ (checksumString >> 8);
};

const loadDefinitions = (dirPath, definitions) => {
    for (let i = 0; i < definitions.length; i++) {
        const def = definitions[i];
        const fileName = `${dirPath}/${def}.xml`;

        let data = null;
        try {
            data = xmlParser.parse(fileName);
        } catch(err) {
            console.log(`Unable to open and/or parse file '${fileName}' ${err}`);
            continue;
        }

        return {
            enumTypes: data['enums']['enum'],
            messageTypes: data['messages']['message']
        }
    }
};

module.exports = {
    calcChecksum,
    calcMessageTypeChecksum,
    loadDefinitions
}
