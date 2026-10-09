import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export const LANGUAGES = [
    { code: 'en', shortLabel: 'EN', label: 'English' },
    { code: 'zh-CN', shortLabel: '中', label: '简体中文' }
]

export const LANGUAGE_STORAGE_KEY = 'flowise.language'

export const normalizeLanguage = (language) => {
    if (!language) return 'en'
    const lower = language.toLowerCase()
    if (lower.startsWith('zh')) return 'zh-CN'
    return 'en'
}

const getInitialLanguage = () => {
    try {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
        if (saved) return normalizeLanguage(saved)
        return normalizeLanguage(navigator.language || navigator.userLanguage)
    } catch (e) {
        return 'en'
    }
}

/**
 * Merge per-module translation fragments.
 *
 * Every file under `locales/en/*.json` and `locales/zh-CN/*.json` contributes
 * additional top-level namespaces (or extra keys inside existing namespaces).
 * Fragments are merged on top of the base `en.json` / `zh-CN.json` so they can
 * extend the core dictionary without editing it.
 *
 * Fragment shape: { "<namespace>": { "someKey": "Some text", ... } }
 */
const mergeFragments = (modules) => {
    const merged = {}
    Object.keys(modules)
        .sort()
        .forEach((path) => {
            const mod = modules[path]
            const data = mod?.default ?? mod
            if (!data || typeof data !== 'object') return
            Object.keys(data).forEach((namespace) => {
                const values = data[namespace]
                if (!values || typeof values !== 'object') return
                merged[namespace] = { ...(merged[namespace] || {}), ...values }
            })
        })
    return merged
}

const mergeNamespaces = (base, fragments) => {
    const result = { ...base }
    Object.keys(fragments).forEach((namespace) => {
        result[namespace] = { ...(result[namespace] || {}), ...fragments[namespace] }
    })
    return result
}

const enResources = mergeNamespaces(en, mergeFragments(import.meta.glob('./locales/en/*.json', { eager: true })))
const zhResources = mergeNamespaces(zhCN, mergeFragments(import.meta.glob('./locales/zh-CN/*.json', { eager: true })))

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: enResources },
        'zh-CN': { translation: zhResources }
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    },
    returnEmptyString: false
})

i18n.on('languageChanged', (language) => {
    const normalized = normalizeLanguage(language)
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized)
    } catch (e) {
        // ignore storage errors (e.g. private mode)
    }
    if (document?.documentElement) {
        document.documentElement.setAttribute('lang', normalized)
    }
})

if (document?.documentElement) {
    document.documentElement.setAttribute('lang', normalizeLanguage(i18n.language))
}

export default i18n
