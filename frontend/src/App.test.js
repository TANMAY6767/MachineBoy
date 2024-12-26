import { render, screen } from '@testing-library/react';
import App from './App';
import React from 'react';

test('renders the Navbar component', () => {
  render(<App />);
  // Replace 'Navbar' with any text or element that you expect to be in the Navbar component.
  const navbarElement = screen.getByRole('navigation'); // or use text if appropriate
  expect(navbarElement).toBeInTheDocument();
});

test('renders the Footer component', () => {
  render(<App />);
  // Replace 'Footer' with any text or element that you expect to be in the Footer component.
  const footerElement = screen.getByText(/footer text/i); // Adjust based on actual footer content
  expect(footerElement).toBeInTheDocument();
});
