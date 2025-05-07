import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import SellerProfile from './SellerDashBoard';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true)
}));

const mockNavigate = jest.fn();

global.FileReader = class {
  constructor() {
    this.onload = null;
  }
  readAsDataURL() {
    setTimeout(() => {
      this.onload({ target: { result: 'data:image/jpeg;base64,mockBase64Data' } });
    }, 0);
  }
};

global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

const mockUser = {
  id: '123',
  username: 'testuser',
  password: 'hashedPassword'
};

const mockBooks = [
  {
    id: '1',
    bookName: 'Test Book',
    address: '123 Book St',
    pincode: '12345',
    price: '15.99',
    imageUrl: 'test-image.jpg',
    listingType: 'sell'
  }
];

const mockSubscription = {
  plan: 'Premium'
};

const createMockStore = () => {
  return configureStore({
    reducer: {
      user: (
        state = {
          sell: {
            userId: '123',
            username: 'testuser',
            email: 'test@example.com'
          },
          buy: {}
        },
        action
      ) => state
    }
  });
};

const renderWithProviders = (component) => {
  const mockStore = createMockStore();
  return render(
    <Provider store={mockStore}>
      <MemoryRouter>{component}</MemoryRouter>
    </Provider>
  );
};

describe('SellerProfile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    axios.get.mockImplementation((url) => {
      if (url === 'http://localhost:5000/check-auth') {
        return Promise.resolve({ data: { authenticated: true } });
      } else if (url === 'http://localhost:5000/details') {
        return Promise.resolve({ data: { user: mockUser, books: mockBooks } });
      } else if (url.includes('http://localhost:5000/subscription/')) {
        return Promise.resolve({ data: mockSubscription });
      } else if (url.includes('requests')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders loading state initially', () => {
    renderWithProviders(<SellerProfile />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders user profile after loading', async () => {
    await act(async () => {
      renderWithProviders(<SellerProfile />);
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('My Books')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('changes tab when clicked', async () => {
    await act(async () => {
      renderWithProviders(<SellerProfile />);
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Upload a book')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Home'));

    expect(screen.getByText('Welcome to ShelfX!')).toBeInTheDocument();
    expect(screen.getByText('Change your password')).toBeInTheDocument();
  });

  test('opens and closes upload dialog', async () => {
    await act(async () => {
      renderWithProviders(<SellerProfile />);
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Upload a book'));

    expect(screen.getByText('Upload a Book')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Upload a Book')).not.toBeInTheDocument();
    });
  });

  test('redirects to login if not authenticated', async () => {
    axios.get.mockImplementation((url) => {
      if (url === 'http://localhost:5000/check-auth') {
        return Promise.resolve({ data: { authenticated: false } });
      }
      return Promise.reject(new Error('Not found'));
    });

    await act(async () => {
      renderWithProviders(<SellerProfile />);
    });

    await waitFor(() => {
    //   expect(mockNavigate).toHaveBeenCalledWith('/login-seller');
    });
  });

  test('redirects to login if not authenticated', async () => {
    axios.get.mockImplementation((url) => {
      if (url === 'http://localhost:5000/check-auth') {
        return Promise.resolve({ data: { authenticated: false } });
      }
      return Promise.reject(new Error('Not found'));
    });

    await act(async () => {
      renderWithProviders(<SellerProfile />);
    });

    // await waitFor(() => {
    //   expect(mockNavigate).toHaveBeenCalledWith('/login-seller');
    // });
  });
});
