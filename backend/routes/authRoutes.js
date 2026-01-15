import express from "express"
import { RegisterController, SignInController } from "../controllers/authController.js"

const router = express.Router()

router.post('/register', RegisterController)
router.post('/login', SignInController)

export default  router