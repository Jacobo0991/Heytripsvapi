const express = require('express');
const multer = require('multer'); 
const router = express.Router();
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage});
const postController = require('../controllers/post.controller');
const runValidation = require('../validators/index.middleware');
const { authentication, authorization } = require("../middlewares/auth.middlewares");
const { savePostValidator, validateId, reportValidator } = require('../validators/post.validators');

//Obtener posts para home
router.get('/upcoming/', postController.findUpcoming)
router.get('/recent/', postController.findRecent)
//Obtener post por agencia
router.get('/agency/:id', validateId, runValidation, postController.findFromAgency);
//Obtener posts reportados
router.get('/reported/', authentication, authorization, runValidation, postController.findReported);

//Crear/actualizar post
router.post(["/create/", "/update/:id"], upload.single("image"), authentication, savePostValidator, runValidation, postController.savePost);

//Reportar post
router.patch("/report/:id", authentication, validateId, reportValidator, runValidation, postController.reportPost);
//Eliminar reporte
router.patch("/undo-report/:id", authentication, validateId, runValidation, postController.undoReport);

//Eliminar post
router.delete('/own/:id', authentication, validateId, runValidation, postController.deleteOwn);
router.delete('/:id', authentication, authorization, validateId, runValidation, postController.deletePost);

module.exports = router