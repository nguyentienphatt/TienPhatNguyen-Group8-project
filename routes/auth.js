const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);   // <- mục tiêu chính
router.post('/logout', ctrl.logout);
router.get('/me', auth(true), (req, res) => res.json(req.user));

// For SV3: list current user's refresh tokens (protected)
router.get('/tokens', auth(true), ctrl.listMyRefreshTokens);

// Dev-only: use controller which includes DB-ready checks
router.post('/seed-user', ctrl.seedUser);


module.exports = router;
