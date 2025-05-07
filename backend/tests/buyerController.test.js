// Set test environment
process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import {
  signupBuyer,
  loginBuyer,
  exploreBuyer,
  getBuyers,
  postRequest,
  updateBuyer,
  deleteBuyer,
  countBuyers,
  editBuyerProfile,
  getBookStatus
} from '../controllers/buyerController.js';
import bcrypt from 'bcrypt';
import db from '../db.js';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('../db.js');
jest.mock('../config/redis.js', () => ({
  cacheMiddleware: jest.fn(() => (req, res, next) => next()),
  clearCache: jest.fn(),
  default: {
    on: jest.fn(),
    connect: jest.fn(),
    isOpen: false,
    get: jest.fn(),
    setEx: jest.fn(),
    keys: jest.fn(),
    del: jest.fn()
  }
}));

describe('Buyer Controller Tests', () => {
  // Mock request and response objects
  let req;
  let res;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Initialize request and response objects
    req = {
      body: {},
      session: {},
      sessionID: 'test-session-id',
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
  });

  // Add cleanup after all tests
  afterAll(async () => {
    await db.end();
    await new Promise(resolve => setTimeout(resolve, 100)); // Ensure all async operations complete
    jest.clearAllMocks();
  });

  describe('signupBuyer', () => {
    it('should register a new buyer successfully', async () => {
      // Arrange
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        pincode: '123456',
        state: 'TestState'
      };
      
      bcrypt.hash.mockResolvedValue('hashedpassword123');
      db.query.mockResolvedValue([]);
      
      // Act
      await signupBuyer(req, res);
      
      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.query).toHaveBeenCalledWith(
        "INSERT INTO buyers (username, email, password, pincode, state) VALUES (?, ?, ?, ?, ?)",
        ['testuser', 'test@example.com', 'hashedpassword123', '123456', 'TestState']
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('Registration successful');
    });
    
    it('should return 500 if database query fails', async () => {
      // Arrange
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        pincode: '123456',
        state: 'TestState'
      };
      
      bcrypt.hash.mockResolvedValue('hashedpassword123');
      db.query.mockRejectedValue(new Error('Database error'));
      
      // Act
      await signupBuyer(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');
    });
  });

  describe('loginBuyer', () => {
    it('should login a buyer successfully', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockUser = { id: 1, password: 'hashedpassword123' };
      db.query.mockResolvedValue([[mockUser]]);
      bcrypt.compare.mockResolvedValue(true);
      
      req.session.save = jest.fn((callback) => callback());
      
      // Act
      await loginBuyer(req, res);
      
      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, password FROM buyers WHERE email = ?',
        ['test@example.com']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword123');
      expect(req.session.userId).toBe(1);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Login successful', 
        session: req.session 
      });
    });
    
    it('should return 401 if email is invalid', async () => {
      // Arrange
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      db.query.mockResolvedValue([[]]);
      
      // Act
      await loginBuyer(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Invalid email or password');
    });
    
    it('should return 401 if password is invalid', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const mockUser = { id: 1, password: 'hashedpassword123' };
      db.query.mockResolvedValue([[mockUser]]);
      bcrypt.compare.mockResolvedValue(false);
      
      // Act
      await loginBuyer(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Invalid email or password');
    });
  });

  describe('exploreBuyer', () => {
    it('should fetch user details and available books', async () => {
      // Arrange
      req.session.userId = 1;
      
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      const mockBooks = [
        { id: 1, userId: 2, bookname: 'Test Book', address: '123 Test St', pincode: '123456', price: 19.99, imageData: 'base64data', listingType: 'sell' }
      ];
      
      db.query.mockImplementation((sql) => {
        if (sql.includes('FROM buyers WHERE id')) {
          return [[mockUser]];
        } else if (sql.includes('FROM books')) {
          return [[mockBooks[0]]];
        }
      });
      
      // Act
      await exploreBuyer(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith({
        user: mockUser,
        books: [{
          id: 1,
          userId: 2,
          bookName: 'Test Book',
          address: '123 Test St',
          pincode: '123456',
          price: 19.99,
          imageUrl: 'base64data',
          listingType: 'sell'
        }]
      });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.session.userId = null;
      
      // Act
      await exploreBuyer(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
  });

  describe('postRequest', () => {
    it('should create a book request successfully', async () => {
      // Arrange
      req.session.userId = 1;
      req.body = {
        bookId: 2,
        sellerId: 3
      };
      
      db.query.mockResolvedValue([]);
      
      // Act
      await postRequest(req, res);
      
      // Assert
      expect(db.query).toHaveBeenCalledWith(
        "INSERT INTO request (userId, bookId, sellerId) VALUES (?, ?, ?)",
        [1, 2, 3]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith('Request created successfully');
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.session.userId = null;
      req.body = {
        bookId: 2,
        sellerId: 3
      };
      
      // Act
      await postRequest(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('User not authenticated');
    });
  });

  describe('editBuyerProfile', () => {
    it('should update username successfully', async () => {
      // Arrange
      req.session.userId = 1;
      req.body = {
        username: 'newusername'
      };
      
      db.query.mockResolvedValue([{ affectedRows: 1 }]);
      
      // Act
      await editBuyerProfile(req, res);
      
      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE buyers SET username = ? WHERE id = ?',
        ['newusername', 1]
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Username updated successfully' });
    });
    
    it('should update password successfully', async () => {
      // Arrange
      req.session.userId = 1;
      req.body = {
        newPassword: 'newpassword123'
      };
      
      bcrypt.hash.mockResolvedValue('newhashed123');
      db.query.mockResolvedValue([{ affectedRows: 1 }]);
      
      // Act
      await editBuyerProfile(req, res);
      
      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE buyers SET password = ? WHERE id = ?',
        ['newhashed123', 1]
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
    });
  });

  describe('getBookStatus', () => {
    it('should return book request status for a buyer', async () => {
      // Arrange
      req.session.userId = 1;
      
      const mockRequests = [
        { bookId: 1, requestDate: '2025-05-01', status: 'pending' }
      ];
      
      const mockBooks = [
        { bookId: 1, bookName: 'Test Book', price: 19.99 }
      ];
      
      db.query.mockImplementation((sql) => {
        if (sql.includes('FROM request')) {
          return [mockRequests];
        } else if (sql.includes('FROM books')) {
          return [mockBooks];
        }
      });
      
      // Act
      await getBookStatus(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith({
        requests: [{
          bookId: 1,
          bookName: 'Test Book',
          bookPrice: 19.99,
          date: '2025-05-01',
          status: 'pending'
        }]
      });
    });
    
    it('should return 404 if no requests found', async () => {
      // Arrange
      req.session.userId = 1;
      db.query.mockResolvedValue([[]]);
      
      // Act
      await getBookStatus(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No requests found for this buyer' });
    });
  });

  // Add more tests for remaining functions
  describe('getBuyers', () => {
    it('should return all buyers', async () => {
      // Arrange
      const mockBuyers = [
        { id: 1, username: 'user1', email: 'user1@example.com' },
        { id: 2, username: 'user2', email: 'user2@example.com' }
      ];
      
      db.query.mockResolvedValue([mockBuyers]);
      
      // Act
      await getBuyers(req, res);
      
      // Assert
      expect(db.query).toHaveBeenCalledWith("SELECT id, username, email FROM buyers");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBuyers);
    });
  });

  describe('updateBuyer', () => {
    it('should update a buyer successfully', async () => {
      // Arrange
      req.params = { id: 1 };
      req.body = {
        username: 'updateduser',
        email: 'updated@example.com'
      };
      
      db.query.mockResolvedValue([]);
      
      // Act
      await updateBuyer(req, res);
      
      // Assert
      expect(db.query).toHaveBeenCalledWith(
        "UPDATE buyers SET username = ?, email = ? WHERE id = ?",
        ['updateduser', 'updated@example.com', 1]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('Buyer updated successfully');
    });
  });

  describe('deleteBuyer', () => {
    it('should delete a buyer successfully', async () => {
      // Arrange
      req.params = { id: 1 };
      db.query.mockResolvedValue([]);
      
      // Act
      await deleteBuyer(req, res);
      
      // Assert
      expect(db.query).toHaveBeenCalledWith("DELETE FROM buyers WHERE id = ?", [1]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('Buyer deleted successfully');
    });
  });

  describe('countBuyers', () => {
    it('should return the count of buyers', async () => {
      // Arrange
      db.query.mockResolvedValue([[{ count: 5 }]]);
      
      // Act
      await countBuyers(req, res);
      
      // Assert
      expect(db.query).toHaveBeenCalledWith("SELECT COUNT(*) as count FROM buyers");
      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });
  });
});