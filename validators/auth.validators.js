const { body, param } = require('express-validator');
const validators = {};
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!¿#$&*+-.:@[\]^_{}~])(?=.{8,32})/
const duiRegex = /^(?=\d{8}-{1}\d{1})/

validators.recoveryValidator = [
    body("email")
        .notEmpty().withMessage("An email is required")
]

validators.codeValidator = [
    body("email")
        .notEmpty().withMessage("An email is required"),
    body("code")
        .notEmpty().withMessage("A code is required")
]

validators.newPassValidator = [
    body("email")
        .notEmpty().withMessage("An email is required"),
    body("pass")
        .notEmpty().withMessage("A password is required")
        .matches(passwordRegex).withMessage("Invalid password format")   
]

validators.registerAgencyValidator = [
    body("name")
        .notEmpty().withMessage("A name is required")
        .isLength({ max: 128 }).withMessage("Name must not exceed 128 characters"),
    body("email")
        .notEmpty().withMessage("An email is required")
        .isEmail().withMessage("Invalid email"),
    body("dui")
        .notEmpty().withMessage("A DUI is requried")
        .matches(duiRegex).withMessage("DUI format not valid")
        //Validación customizada para un dui válido
        .custom((dui) => {
            const _dui = dui.replace('-', "");
            let sum = 0, pos = 9;
            for (let i = 0; i < _dui.length - 1; i++) {
                sum = sum + (_dui[i] * pos);
                pos = pos - 1
            }
            sum = 10 - (sum % 10);
            if (sum == _dui[8] || sum == 0) {
                return true;
            } else {
                return false;
            }
        }).withMessage("Invalid DUI"),
    body("number")
        .notEmpty().withMessage("A phone number is required")
        //El telefono lo recibe sin guion
        .isMobilePhone("es-SV").withMessage("Phone number not valid"),
    body("password")
        .notEmpty().withMessage("A password is required")
        .matches(passwordRegex).withMessage("Password format not valid"),
    body("instagram").optional(),
    body("facebook").optional()
];

validators.registerUserValidator = [
    body("email")
        .notEmpty().withMessage("An email is required")
        .isEmail().withMessage("Invalid email"),
    body("name")
        .notEmpty().withMessage("A name is required"),
    body("password").notEmpty().withMessage("A password is required")
        .matches(passwordRegex).withMessage("Invalid password format")
];

module.exports = validators;