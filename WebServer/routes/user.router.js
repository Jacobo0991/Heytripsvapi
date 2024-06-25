const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller')
const { authentication, checkRepeatedEmail } = require("../middlewares/auth.middlewares");
const runValidation = require('../validators/index.middleware');
const {validateId} = require('../validators/user.validators')

router.get("/saved/", authentication, runValidation, userController.getSaved)
router.patch("/save/:id", authentication, validateId, runValidation, userController.savePost);
router.post("/edit-profile/", authentication, checkRepeatedEmail ,runValidation, userController.editOwn);

module.exports = router;