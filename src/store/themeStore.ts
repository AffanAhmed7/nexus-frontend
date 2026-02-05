import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
    const stored = localStorage.getItem('theme');
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
};

export const useThemeStore = create<ThemeState>((set) => ({
    theme: getInitialTheme(),
    toggleTheme: () => {
        set((state) => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            return { theme: newTheme };
        });
    },
    setTheme: (theme) => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
    },
}));

// Initialize theme on load
if (typeof window !== 'undefined') {
    const initialTheme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', initialTheme);
}

