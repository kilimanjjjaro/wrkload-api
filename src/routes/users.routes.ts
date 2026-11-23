import { Router } from 'express'
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser
} from '../controllers/users.controllers.ts'
import { requireAccessToken } from '../middlewares/requireAccessToken.middleware.ts'
import {
  usersParamsValidations,
  uidParamValidations,
  updateDataValidations
} from '../middlewares/validateData.middleware.ts'
const router = Router()

router.get('/', requireAccessToken, usersParamsValidations, getUsers)
router.get('/:uid', requireAccessToken, uidParamValidations, getUser)
router.delete('/:uid', requireAccessToken, uidParamValidations, deleteUser)
router.patch(
  '/:uid',
  requireAccessToken,
  uidParamValidations,
  updateDataValidations,
  updateUser
)

export default router
