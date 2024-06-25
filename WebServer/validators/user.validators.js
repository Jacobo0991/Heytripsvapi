const { param } = require('express-validator')
const validators = {};

validators.validateId = [
    param("id")
        .notEmpty().withMessage("An ID is required")
        .isMongoId().withMessage("Invalid ID")
];

module.exports = validators
