const express = require('express');
const multer = require('multer'); 
const router = express.Router();
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage});
const agencyController = require('../controllers/agency.controller')
const { authentication, authorization, checkRepeatedEmail } = require("../middlewares/auth.middlewares");
const { validateId, reportValidator } = require("../validators/post.validators")
const runValidation = require('../validators/index.middleware');


//Obtener agencias reportadas
router.get('/reported/', authentication, authorization, runValidation, agencyController.findReported);

//Reportar agencia
router.patch("/report/:id", authentication, validateId, reportValidator, runValidation, agencyController.reportAgency);
//Eliminar reporte
router.patch("/undo-report/:id", authentication, validateId, runValidation, agencyController.undoReport);

//Editar perfil
router.post("/edit-profile/",upload.single("image"), authentication, checkRepeatedEmail, runValidation, agencyController.editOwn);

module.exports = router;