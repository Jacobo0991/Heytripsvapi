const { body, param } = require('express-validator')
const POST_CONSTANTS = require('../data/post.constants.json')
const validators = {};

validators.validateId = [
    param("id")
        .notEmpty().withMessage("An ID is required")
        .isMongoId().withMessage("Invalid ID")
]

validators.reportValidator = [
    body("content")
        .notEmpty().withMessage("The report reason is required")
        .isLength( {max: 150} ).withMessage("The report reason must not exceed 150 characters")
]

validators.validateCategory = [
    //Validar la categoría a buscar
    param("category")
        .optional()
        .isIn([POST_CONSTANTS.CATEGORY.BEACHES, POST_CONSTANTS.CATEGORY.MOUNTAINS,
            POST_CONSTANTS.CATEGORY.TOWNS, POST_CONSTANTS.CATEGORY.ROUTES,
            POST_CONSTANTS.CATEGORY.OTHERS
        ]).withMessage("Invalid category"),
]

//Validar el formulario para los filtros
validators.validateFilter = [
    body("search")
        .optional().trim().isLength({ max: 150})

];

//Validar el formulario para crear o actualizar post
validators.savePostValidator = [
    param("id")
        .optional()
        .isMongoId().withMessage("Invalid post"),
    body("title")
        .optional()
        .trim().isLength({ max: 32}).withMessage("Name must not exceed 32 characters"),
    body("description")
        .notEmpty().withMessage("A description is required")
        .trim().isLength({ max: 150}).withMessage("Description must not exceed 150 characters"),
    body("date")
        .notEmpty().withMessage("A date is required")
        .isISO8601().withMessage("Invalid date"),
    body("meeting")
        .notEmpty().withMessage("A meeting place is required")
        .trim().isLength({max: 64}).withMessage("Meeting place must not exceed 64 characters"),
    body("category")
        .notEmpty().withMessage("Category is required")
        .isIn([POST_CONSTANTS.CATEGORY.BEACHES, POST_CONSTANTS.CATEGORY.MOUNTAINS,
            POST_CONSTANTS.CATEGORY.TOWNS, POST_CONSTANTS.CATEGORY.ROUTES,
            POST_CONSTANTS.CATEGORY.OTHERS
        ]).withMessage("Invalid category"),
    body("lat")
        .notEmpty().withMessage("Location is required")
        .isNumeric().withMessage("Invalid location"),
    body("long")
        .notEmpty().withMessage("Location is required")
        .isNumeric().withMessage("Invalid location"),
    body("price")
        .notEmpty().withMessage("A price is required")
        .isNumeric().withMessage("Invalid price")
];

module.exports = validators;