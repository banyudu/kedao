import { atom } from 'jotai'
import defaultLang from '../i18n/zh'
import { Language } from '../types'

export const linkEditorActiveAtom = atom(false)

export const langAtom = atom<Language>(defaultLang)
