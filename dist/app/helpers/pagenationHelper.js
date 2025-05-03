"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagenationHelpars = void 0;
const calculatePagenation = (options) => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (Number(page) - 1) * limit;
    const sortBy = options.sortBy || 'createAt';
    const sortOrder = options.sortOrder || 'desc';
    return {
        page,
        limit,
        skip,
        sortBy,
        sortOrder
    };
};
exports.pagenationHelpars = {
    calculatePagenation
};
