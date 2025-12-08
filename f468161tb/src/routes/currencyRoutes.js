import express from 'express';
import {
    getCurrencies,
    getCurrencyByCode,
    createCurrency
} from '../controllers/currencyController.js';

const router = express.Router();

router.get('/', getCurrencies);
router.get('/code/:code', getCurrencyByCode);
router.post('/', createCurrency);

export default router;

