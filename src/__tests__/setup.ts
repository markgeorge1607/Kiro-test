import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock lottie-react to avoid canvas dependency in jsdom
vi.mock('lottie-react', () => ({
  default: React.forwardRef((_props: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) =>
    React.createElement('div', {
      'data-testid': 'lottie-animation',
      ref,
    }),
  ),
}));
