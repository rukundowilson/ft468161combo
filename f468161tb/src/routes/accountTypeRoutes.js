import express from 'express';
import {
    getAccountTypes,
    getAccountTypeById,
    createAccountType
} from '../controllers/accountTypeController.js';

const router = express.Router();

router.get('/', getAccountTypes);
router.get('/:id', getAccountTypeById);
router.post('/', createAccountType);

export default router;

