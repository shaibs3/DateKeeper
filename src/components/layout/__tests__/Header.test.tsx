import { render, screen } from '@testing-library/react';
import { Header } from '../Header';

describe('Header', () => {
  it('renders the logo', () => {
    render(<Header />);
    const logo = screen.getByText(/BirthdayBuddy/i);
    expect(logo).toBeInTheDocument();
  });

  it('renders authentication links', () => {
    render(<Header />);
    const loginLink = screen.getByText(/Log In/i);
    const signupLink = screen.getByText(/Sign Up/i);
    
    expect(loginLink).toBeInTheDocument();
    expect(signupLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/auth/login');
    expect(signupLink).toHaveAttribute('href', '/auth/signup');
  });

  it('has correct styling classes', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    const signupButton = screen.getByText(/Sign Up/i);
    
    expect(header).toHaveClass('bg-white', 'border-b');
    expect(signupButton).toHaveClass('btn-primary');
  });
}); 