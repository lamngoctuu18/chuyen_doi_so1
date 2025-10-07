const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập hệ thống
 *     description: Đăng nhập chung cho tất cả loại tài khoản (Admin, Sinh viên, Giảng viên, Doanh nghiệp)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             sinh-vien:
 *               summary: Đăng nhập sinh viên
 *               value:
 *                 userId: "SV001"
 *                 password: "123456"
 *                 role: "sinh-vien"
 *             giang-vien:
 *               summary: Đăng nhập giảng viên
 *               value:
 *                 userId: "GV001"
 *                 password: "123456"
 *                 role: "giang-vien"
 *             doanh-nghiep:
 *               summary: Đăng nhập doanh nghiệp
 *               value:
 *                 userId: "DN001"
 *                 password: "123456"
 *                 role: "doanh-nghiep"
 *             admin:
 *               summary: Đăng nhập admin
 *               value:
 *                 userId: "admin001"
 *                 password: "123456"
 *                 role: "admin"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Thông tin đăng nhập không chính xác
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Mã đăng nhập hoặc mật khẩu không chính xác"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /api/auth/login/sinh-vien:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập dành riêng cho sinh viên
 *     description: Endpoint đăng nhập riêng biệt cho sinh viên
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, password]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Mã sinh viên
 *                 example: "SV001"
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Thông tin đăng nhập không chính xác
 */
router.post('/login/sinh-vien', AuthController.loginSinhVien);

/**
 * @swagger
 * /api/auth/login/admin:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập dành riêng cho admin
 *     description: Endpoint đăng nhập riêng biệt cho quản trị viên
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, password]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Mã admin
 *                 example: "admin001"
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Thông tin đăng nhập không chính xác
 */
router.post('/login/admin', AuthController.loginAdmin);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng xuất khỏi hệ thống
 *     description: Đăng xuất và vô hiệu hóa token hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đăng xuất thành công"
 */
router.post('/logout', AuthController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Lấy thông tin người dùng hiện tại
 *     description: Lấy thông tin chi tiết của người dùng đang đăng nhập
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: string
 *                       example: "SV001"
 *                     role:
 *                       type: string
 *                       example: "sinh-vien"
 *                     name:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                     email:
 *                       type: string
 *                       example: "sv001@dainam.edu.vn"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authenticateToken, AuthController.me);

module.exports = router;