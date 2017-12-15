// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at http://www.apache.org/licenses/LICENSE-2.0
// Copyright 2017 Ryler Hockenbury

// Type to byte length mapping
// Note: Javascript can only represent up to 53-bit integers natively
const TYPE_LENGTHS = {
    'float': 4,
    'double': 8,
    'char': 1,
    'int8_t': 1,
    'uint8_t': 1,
    'int16_t': 2,
    'uint16_t': 2,
    'int32_t': 4,
    'uint32_t': 4,
    'int64_t': 8,
    'uint64_t': 8
};

module.exports = {
    TYPE_LENGTHS
};
