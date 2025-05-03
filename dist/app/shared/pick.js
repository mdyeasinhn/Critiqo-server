"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Pick specific properties from an object
 * @param obj - Object to pick properties from
 * @param keys - Array of keys to pick
 * @returns Object with only the picked properties
 */
const pick = (obj, keys) => {
    const finalObj = {};
    for (const key of keys) {
        if (obj && Object.hasOwnProperty.call(obj, key)) {
            finalObj[key] = obj[key];
        }
    }
    return finalObj;
};
exports.default = pick;
