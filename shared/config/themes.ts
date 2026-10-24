export type ThemeType = 'light' | 'dark'

export interface ThemeDef {
  id: string
  label: string
  type: ThemeType
  recommended?: boolean
  contrastWarning?: boolean
  colors: { primary: string; secondary: string; accent: string; base: string }
}

export const defaultTheme = 'tachy'

export const themes: ThemeDef[] = [
  { id: 'tachy', label: 'Tachy', type: 'dark', recommended: true, colors: { primary: '#f4c95d', secondary: '#60a5fa', accent: '#e0b447', base: '#17191c' } },
  { id: 'light', label: 'Light', type: 'light', colors: { primary: '#2563eb', secondary: '#7c3aed', accent: '#db2777', base: '#ffffff' } },
  { id: 'dark', label: 'Dark', type: 'dark', colors: { primary: '#38bdf8', secondary: '#a78bfa', accent: '#f472b6', base: '#1d232a' } },
  { id: 'cupcake', contrastWarning: true, label: 'Cupcake', type: 'light', colors: { primary: '#65c3c8', secondary: '#ef9fbc', accent: '#eeaf3a', base: '#faf7f5' } },
  { id: 'bumblebee', contrastWarning: true, label: 'Bumblebee', type: 'light', colors: { primary: '#e0a82e', secondary: '#f9d72f', accent: '#181830', base: '#ffffff' } },
  { id: 'emerald', contrastWarning: true, label: 'Emerald', type: 'light', colors: { primary: '#66cc8a', secondary: '#377cfb', accent: '#ea5234', base: '#ffffff' } },
  { id: 'corporate', contrastWarning: true, label: 'Corporate', type: 'light', colors: { primary: '#4b6bfb', secondary: '#7b92b2', accent: '#67cba0', base: '#ffffff' } },
  { id: 'synthwave', label: 'Synthwave', type: 'dark', colors: { primary: '#e779c1', secondary: '#58c7f3', accent: '#f3cc30', base: '#1a103d' } },
  { id: 'retro', contrastWarning: true, label: 'Retro', type: 'light', colors: { primary: '#ef9995', secondary: '#a4cbb4', accent: '#dc8850', base: '#ece3ca' } },
  { id: 'cyberpunk', contrastWarning: true, label: 'Cyberpunk', type: 'light', colors: { primary: '#ff7598', secondary: '#75d1f0', accent: '#c07eec', base: '#fff248' } },
  { id: 'valentine', contrastWarning: true, label: 'Valentine', type: 'light', colors: { primary: '#e96d7b', secondary: '#a991f7', accent: '#66c7f4', base: '#fff1f2' } },
  { id: 'halloween', label: 'Halloween', type: 'dark', colors: { primary: '#f28c18', secondary: '#6d3a9c', accent: '#51a800', base: '#212121' } },
  { id: 'garden', contrastWarning: true, label: 'Garden', type: 'light', colors: { primary: '#5c7f67', secondary: '#ecf4e7', accent: '#fae5c3', base: '#f7faf5' } },
  { id: 'forest', label: 'Forest', type: 'dark', colors: { primary: '#1fb854', secondary: '#3a7d5f', accent: '#e1b84b', base: '#171212' } },
  { id: 'aqua', contrastWarning: true, label: 'Aqua', type: 'dark', colors: { primary: '#09ecf3', secondary: '#966fb3', accent: '#ffe999', base: '#345da7' } },
  { id: 'lofi', label: 'Lofi', type: 'light', colors: { primary: '#0d0d0d', secondary: '#1e1e1e', accent: '#2f2f2f', base: '#ffffff' } },
  { id: 'pastel', contrastWarning: true, label: 'Pastel', type: 'light', colors: { primary: '#d1c1d7', secondary: '#f6cbd1', accent: '#b4e9d6', base: '#ffffff' } },
  { id: 'fantasy', label: 'Fantasy', type: 'light', colors: { primary: '#6e0b14', secondary: '#a21caf', accent: '#f9d72f', base: '#ffffff' } },
  { id: 'wireframe', contrastWarning: true, label: 'Wireframe', type: 'light', colors: { primary: '#b8b8b8', secondary: '#b8b8b8', accent: '#b8b8b8', base: '#ffffff' } },
  { id: 'black', contrastWarning: true, label: 'Black', type: 'dark', colors: { primary: '#333333', secondary: '#333333', accent: '#333333', base: '#000000' } },
  { id: 'luxury', label: 'Luxury', type: 'dark', colors: { primary: '#ffffff', secondary: '#152747', accent: '#f9d72f', base: '#09090b' } },
  { id: 'dracula', label: 'Dracula', type: 'dark', colors: { primary: '#ff79c6', secondary: '#bd93f9', accent: '#ffb86c', base: '#282a36' } },
  { id: 'cmyk', contrastWarning: true, label: 'CMYK', type: 'light', colors: { primary: '#45aeee', secondary: '#e8488a', accent: '#f9d72f', base: '#ffffff' } },
  { id: 'autumn', label: 'Autumn', type: 'light', colors: { primary: '#8c0327', secondary: '#d85251', accent: '#d59b6a', base: '#f1f1f1' } },
  { id: 'business', contrastWarning: true, label: 'Business', type: 'dark', colors: { primary: '#1c4f82', secondary: '#7e7e7e', accent: '#a5c7f7', base: '#202020' } },
  { id: 'acid', contrastWarning: true, label: 'Acid', type: 'light', colors: { primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00', base: '#fafafa' } },
  { id: 'lemonade', contrastWarning: true, label: 'Lemonade', type: 'light', colors: { primary: '#519903', secondary: '#d7e526', accent: '#ffbd00', base: '#ffffff' } },
  { id: 'night', label: 'Night', type: 'dark', colors: { primary: '#38bdf8', secondary: '#818cf8', accent: '#f471b5', base: '#0f172a' } },
  { id: 'coffee', label: 'Coffee', type: 'dark', colors: { primary: '#d6b48c', secondary: '#b8a68f', accent: '#c7a17a', base: '#20161f' } },
  { id: 'winter', label: 'Winter', type: 'light', colors: { primary: '#0069ff', secondary: '#463aa2', accent: '#c148ac', base: '#ffffff' } },
  { id: 'dim', label: 'Dim', type: 'dark', colors: { primary: '#9fe88d', secondary: '#ff7d7d', accent: '#ffd47a', base: '#2a303c' } },
  { id: 'nord', contrastWarning: true, label: 'Nord', type: 'light', colors: { primary: '#5e81ac', secondary: '#81a1c1', accent: '#88c0d0', base: '#eceff4' } },
  { id: 'sunset', label: 'Sunset', type: 'dark', colors: { primary: '#ff865b', secondary: '#fd6f9c', accent: '#b387ff', base: '#121212' } },
  { id: 'caramellatte', contrastWarning: true, label: 'Caramel Latte', type: 'light', colors: { primary: '#b88a5c', secondary: '#9b6f4a', accent: '#d9a066', base: '#fdf6ec' } },
  { id: 'abyss', label: 'Abyss', type: 'dark', colors: { primary: '#00e0ff', secondary: '#7c3aed', accent: '#22d3ee', base: '#020617' } },
  { id: 'silk', contrastWarning: true, label: 'Silk', type: 'light', colors: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#06b6d4', base: '#fafafa' } },
]

export const themeIds = themes.map(theme => theme.id)
export const themeMap = new Map(themes.map(theme => [theme.id, theme]))

export function getTheme(id: string): ThemeDef {
  return themeMap.get(id) ?? themeMap.get(defaultTheme)!
}
