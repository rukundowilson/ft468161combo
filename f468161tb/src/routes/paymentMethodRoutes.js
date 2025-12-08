import express from 'express';
import {
    createPaymentMethod,
    getPaymentMethods,
    getPaymentMethodById,
    updatePaymentMethod,
    deletePaymentMethod
} from '../controllers/paymentMethodController.js';

const router = express.Router();

router.post('/', createPaymentMethod);
router.get('/', getPaymentMethods);
router.get('/:id', getPaymentMethodById);
router.put('/:id', updatePaymentMethod);
router.delete('/:id', deletePaymentMethod);

export default router;

