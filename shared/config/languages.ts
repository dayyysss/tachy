export interface LanguageDef {
  code: string
  label: string
  englishName: string
  landingSlug: string
  wordlists: number[]
  quotes: boolean
  available: boolean
}

export const languages: LanguageDef[] = [
  { code: 'en', label: 'English', englishName: 'English', landingSlug: 'english', wordlists: [200, 1000], quotes: true, available: true },
  { code: 'id', label: 'Bahasa Indonesia', englishName: 'Indonesian', landingSlug: 'indonesian', wordlists: [200, 1000], quotes: true, available: true },
  { code: 'es', label: 'Español', englishName: 'Spanish', landingSlug: 'spanish', wordlists: [], quotes: false, available: false },
  { code: 'fr', label: 'Français', englishName: 'French', landingSlug: 'french', wordlists: [], quotes: false, available: false },
  { code: 'de', label: 'Deutsch', englishName: 'German', landingSlug: 'german', wordlists: [], quotes: false, available: false },
  { code: 'pt', label: 'Português', englishName: 'Portuguese', landingSlug: 'portuguese', wordlists: [], quotes: false, available: false },
  { code: 'it', label: 'Italiano', englishName: 'Italian', landingSlug: 'italian', wordlists: [], quotes: false, available: false },
  { code: 'tr', label: 'Türkçe', englishName: 'Turkish', landingSlug: 'turkish', wordlists: [], quotes: false, available: false },
  { code: 'ms', label: 'Bahasa Melayu', englishName: 'Malay', landingSlug: 'malay', wordlists: [], quotes: false, available: false },
  { code: 'jv', label: 'Basa Jawa', englishName: 'Javanese', landingSlug: 'javanese', wordlists: [], quotes: false, available: false },
  { code: 'su', label: 'Basa Sunda', englishName: 'Sundanese', landingSlug: 'sundanese', wordlists: [], quotes: false, available: false },
  { code: 'ja-romaji', label: '日本語 (romaji)', englishName: 'Japanese romaji', landingSlug: 'japanese-romaji', wordlists: [], quotes: false, available: false },
]

export const languageMap = new Map(languages.map(language => [language.code, language]))
export const availableLanguages = languages.filter(language => language.available)
export const defaultLanguage = 'en'

export function getLanguage(code: string): LanguageDef {
  return languageMap.get(code) ?? languageMap.get(defaultLanguage)!
}

export interface CodeLanguageDef {
  code: string
  label: string
}

export const codeLanguages: CodeLanguageDef[] = [
  { code: 'js', label: 'JavaScript' },
  { code: 'ts', label: 'TypeScript' },
  { code: 'py', label: 'Python' },
  { code: 'php', label: 'PHP' },
  { code: 'go', label: 'Go' },
  { code: 'rust', label: 'Rust' },
  { code: 'java', label: 'Java' },
  { code: 'cpp', label: 'C++' },
  { code: 'sql', label: 'SQL' },
  { code: 'html', label: 'HTML/CSS' },
  { code: 'css', label: 'CSS' },
]
