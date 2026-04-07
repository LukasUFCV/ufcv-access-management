import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { ThemeToggle } from '@/components/ui';

describe('Theme toggle', () => {
  it('switches between theme modes and persists the selection', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /sombre/i }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('ufcv-theme-mode')).toBe('dark');
  });
});

