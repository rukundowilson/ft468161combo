import express from 'express';
import {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    getTransactionSummary
} from '../controllers/transactionController.js';

const router = express.Router();

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/summary', getTransactionSummary);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;






