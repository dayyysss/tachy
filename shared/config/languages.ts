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
  { code: 'es', label: 'Español', englishName: 'Spanish', landingSlug: 'spanish', wordlists: [300], quotes: false, available: true },
  { code: 'fr', label: 'Français', englishName: 'French', landingSlug: 'french', wordlists: [300], quotes: false, available: true },
  { code: 'de', label: 'Deutsch', englishName: 'German', landingSlug: 'german', wordlists: [300], quotes: false, available: true },
  { code: 'pt', label: 'Português', englishName: 'Portuguese', landingSlug: 'portuguese', wordlists: [300], quotes: false, available: true },
  { code: 'it', label: 'Italiano', englishName: 'Italian', landingSlug: 'italian', wordlists: [300], quotes: false, available: true },
  { code: 'tr', label: 'Türkçe', englishName: 'Turkish', landingSlug: 'turkish', wordlists: [300], quotes: false, available: true },
  { code: 'ms', label: 'Bahasa Melayu', englishName: 'Malay', landingSlug: 'malay', wordlists: [300], quotes: false, available: true },
  { code: 'jv', label: 'Basa Jawa', englishName: 'Javanese', landingSlug: 'javanese', wordlists: [300], quotes: false, available: true },
  { code: 'su', label: 'Basa Sunda', englishName: 'Sundanese', landingSlug: 'sundanese', wordlists: [300], quotes: false, available: true },
  { code: 'ja-romaji', label: '日本語 (romaji)', englishName: 'Japanese romaji', landingSlug: 'japanese-romaji', wordlists: [300], quotes: false, available: true },
  { code: 'ru', label: 'Русский (latin)', englishName: 'Russian', landingSlug: 'russian', wordlists: [300], quotes: false, available: true },
  { code: 'ko-romaja', label: '한국어 (romaja)', englishName: 'Korean romaja', landingSlug: 'korean', wordlists: [300], quotes: false, available: true },
  { code: 'la', label: 'Latina', englishName: 'Latin', landingSlug: 'latin', wordlists: [300], quotes: false, available: true },
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
  { code: 'c', label: 'C' },
  { code: 'cpp', label: 'C++' },
  { code: 'csharp', label: 'C#' },
  { code: 'java', label: 'Java' },
  { code: 'kotlin', label: 'Kotlin' },
  { code: 'swift', label: 'Swift' },
  { code: 'go', label: 'Go' },
  { code: 'rust', label: 'Rust' },
  { code: 'php', label: 'PHP' },
  { code: 'ruby', label: 'Ruby' },
  { code: 'dart', label: 'Dart' },
  { code: 'bash', label: 'Bash / Shell' },
  { code: 'lua', label: 'Lua' },
  { code: 'r', label: 'R' },
  { code: 'sql', label: 'SQL' },
  { code: 'html', label: 'HTML/CSS' },
  { code: 'css', label: 'CSS' },
  { code: 'json', label: 'JSON' },
  { code: 'yaml', label: 'YAML' },
]
