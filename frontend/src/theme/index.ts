import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#00AFF5',
    primaryContainer: '#E3F5FC',
    secondary: '#054752',
    secondaryContainer: '#E8F4F6',
    tertiary: '#FF6F00',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    error: '#B00020',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A1A',
    onSurface: '#1A1A1A',
    outline: '#E0E0E0',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F5F5F5',
      level3: '#EEEEEE',
      level4: '#E8E8E8',
      level5: '#E0E0E0',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00AFF5',
    primaryContainer: '#004D65',
    secondary: '#00AFF5',
    secondaryContainer: '#054752',
    tertiary: '#FF9800',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    error: '#CF6679',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    outline: '#404040',
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#252525',
      level3: '#2D2D2D',
      level4: '#333333',
      level5: '#3D3D3D',
    },
  },
};
