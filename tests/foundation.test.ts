import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('foundation shell', () => {
  it('renders the VN Stock Insight app name', () => {
    render(createElement(App));

    expect(screen.getByRole('heading', { name: 'VN Stock Insight' })).toBeInTheDocument();
  });
});
