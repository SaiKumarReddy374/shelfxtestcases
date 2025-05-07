// Set test environment
process.env.NODE_ENV = 'test';

import { signupSeller, loginSeller, getDetails, uploadBook } from '../controllers/sellerController.js';
import bcrypt from 'bcrypt';
import db from '../db.js';

jest.mock('bcrypt');
jest.mock('../db.js', () => ({
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(true)
}));

afterAll(async () => {
    await db.end();
    await new Promise(resolve => setTimeout(resolve, 100)); // Ensure all async operations complete
    jest.clearAllMocks();
});

describe('sellerController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            session: {},
            file: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
            setHeader: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('signupSeller', () => {
        it('should register a new seller successfully', async () => {
            const mockUser = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            db.query.mockResolvedValueOnce([]);

            mockReq.body = mockUser;

            await signupSeller(mockReq, mockRes);

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(db.query).toHaveBeenCalledWith(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                ['testuser', 'test@example.com', 'hashedPassword']
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith('Registration successful');
        });

        it('should handle registration errors', async () => {
            const mockError = new Error('Database error');
            db.query.mockRejectedValueOnce(mockError);

            mockReq.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            await signupSeller(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('loginSeller', () => {
        it('should authenticate seller with valid credentials', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashedPassword'
            };

            mockReq.body = {
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.session.save = jest.fn((cb) => cb(null));

            db.query.mockResolvedValueOnce([[mockUser]]);
            bcrypt.compare.mockResolvedValueOnce(true);

            await loginSeller(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Login successful',
                session: expect.objectContaining({
                    userId: 1
                })
            }));
        });
    });

    describe('getDetails', () => {
        it('should return seller details and books', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com'
            };

            const mockBooks = [{
                id: 1,
                bookname: 'Test Book',
                address: 'Test Address',
                pincode: '123456',
                price: 100,
                imageData: Buffer.from('test-image')
            }];

            mockReq.session.userId = 1;
            db.query.mockResolvedValueOnce([[mockUser]]);
            db.query.mockResolvedValueOnce([mockBooks]);

            await getDetails(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                user: mockUser,
                books: expect.arrayContaining([
                    expect.objectContaining({
                        id: 1,
                        bookName: 'Test Book',
                        address: 'Test Address',
                        pincode: '123456',
                        price: 100
                    })
                ])
            });
        });

        it('should handle unauthorized access', async () => {
            mockReq.session.userId = null;

            await getDetails(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
        });
    });
});