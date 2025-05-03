"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
};
exports.default = catchAsync;
