import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { normalizeLanguage } from '@/i18n'
import zhCNCategories from './zh-CN/categories.json'

/**
 * Node metadata localization.
 *
 * Flowise component nodes (packages/components) ship English `label`,
 * `description` and `category` from the backend, and those same strings are
 * persisted inside saved flow data. They are also used as *logic* values all
 * over the UI (e.g. `category === 'Agent Flows'`, `label.includes('Upsert')`),
 * so they must never be mutated — we only translate them for display.
 *
 * Node `name` (e.g. `calculator`, `chatOpenAI`) is the stable identifier and is
 * used as the dictionary key here, so translated labels survive renames of the
 * English label and apply to already-saved flows.
 *
 * Dictionaries live in `./<lang>/*.json` and are merged by `import.meta.glob`,
 * matching the pattern used by `src/i18n/locales`.
 */

const mergeModules = (modules) => {
    const merged = {
        nodes: {},
        descriptions: {},
        params: {},
        options: {},
        en: {},
        credentials: {},
        credentialDescriptions: {},
        paramDescriptions: {},
        marketplaceTemplates: {},
        marketplaceDescriptions: {},
        marketplaceUsecases: {},
        marketplaceBadges: {},
        marketplaceTypes: {},
        marketplaceFrameworks: {},
        stickyNotes: {}
    }
    Object.keys(modules)
        .sort()
        .forEach((path) => {
            const mod = modules[path]
            const data = mod?.default ?? mod
            if (!data || typeof data !== 'object') return
            Object.keys(merged).forEach((section) => {
                if (data[section] && typeof data[section] === 'object') {
                    Object.assign(merged[section], data[section])
                }
            })
        })
    return merged
}

const mergeCategories = (modules, fallback) => {
    const merged = { ...(fallback || {}) }
    Object.keys(modules)
        .sort()
        .forEach((path) => {
            const mod = modules[path]
            const data = mod?.default ?? mod
            if (data && typeof data === 'object') Object.assign(merged, data)
        })
    return merged
}

const zhDict = {
    categories: mergeCategories(import.meta.glob('./zh-CN/categories-*.json', { eager: true }), zhCNCategories),
    ...mergeModules(import.meta.glob('./zh-CN/*.json', { eager: true }))
}

const DICTIONARIES = {
    'zh-CN': zhDict
}

export const getNodeDictionary = (language) => DICTIONARIES[normalizeLanguage(language)] || null

/**
 * Translate a node label. Falls back to the node's own (English) label.
 *
 * Users can rename a node on the canvas (EditNodeDialog writes `data.label`).
 * When the stored label no longer matches the shipped English label we treat it
 * as a custom name and leave it untouched.
 */
export const localizeNodeLabel = (node, language) => {
    if (!node) return node
    const dict = getNodeDictionary(language)
    const translated = dict?.nodes?.[node.name]
    if (!translated) return node.label
    const original = dict?.en?.[node.name]
    if (original && typeof node.label === 'string' && node.label !== original) return node.label
    return translated
}

/** Translate a node description. Falls back to the node's own description. */
export const localizeNodeDescription = (node, language) => {
    if (!node || typeof node.description !== 'string') return node?.description
    const dict = getNodeDictionary(language)
    return dict?.descriptions?.[node.name] ?? dict?.params?.[node.description] ?? node.description
}

/** Translate a category name (e.g. 'Tools' → '工具'). Safe no-op in English. */
export const localizeCategory = (category, language) => {
    if (!category) return category
    const dict = getNodeDictionary(language)
    return dict?.categories?.[category] ?? category
}

/** Translate an input/output parameter label. Falls back to the English label. */
export const localizeParamLabel = (label, language) => {
    if (typeof label !== 'string') return label
    const dict = getNodeDictionary(language)
    return dict?.params?.[label] ?? label
}

/**
 * Translate a parameter/option description shown as a tooltip.
 * Keys are the full English description; HTML is preserved verbatim.
 */
export const localizeParamDescription = (description, language) => {
    if (typeof description !== 'string') return description
    const dict = getNodeDictionary(language)
    return dict?.paramDescriptions?.[description] ?? description
}

/** Translate a credential label (e.g. 'OpenAI API' → 'OpenAI API'). */
export const localizeCredentialLabel = (credential, language) => {
    if (!credential) return credential
    const dict = getNodeDictionary(language)
    return dict?.credentials?.[credential.name] ?? credential.label
}

/** Translate a credential description. HTML is preserved verbatim. */
export const localizeCredentialDescription = (credential, language) => {
    if (!credential || typeof credential.description !== 'string') return credential?.description
    const dict = getNodeDictionary(language)
    return dict?.credentialDescriptions?.[credential.name] ?? credential.description
}

/**
 * Marketplace (community template) localization.
 *
 * Templates come from `packages/server/marketplaces/<type>/*.json`. Their
 * `templateName` (the file name), `description`, `usecases`, `badge`,
 * `framework` and `type` are all compared/filtered on as English values in
 * `views/marketplaces`, so they are translated for display only.
 *
 * A missing entry falls back to the original English string, so newly added
 * upstream templates keep working untranslated.
 */
export const localizeMarketplaceTemplate = (template, language) => {
    if (!template) return template
    const dict = getNodeDictionary(language)
    const key = template.templateName
    return (key && dict?.marketplaceTemplates?.[key]) || key || template.name
}

/** Translate a marketplace template description (keyed by `templateName`). */
export const localizeMarketplaceDescription = (template, language) => {
    if (!template) return template
    const dict = getNodeDictionary(language)
    const key = template.templateName
    if (key && dict?.marketplaceDescriptions?.[key]) return dict.marketplaceDescriptions[key]
    return template.description
}

/** Translate a marketplace use case tag. */
export const localizeUsecase = (usecase, language) => {
    if (typeof usecase !== 'string') return usecase
    const dict = getNodeDictionary(language)
    return dict?.marketplaceUsecases?.[usecase] ?? usecase
}

/** Translate a marketplace badge (POPULAR / NEW). */
export const localizeBadge = (badge, language) => {
    if (typeof badge !== 'string') return badge
    const dict = getNodeDictionary(language)
    return dict?.marketplaceBadges?.[badge] ?? badge
}

/** Translate a marketplace template type (Chatflow / AgentflowV2 / Tool). */
export const localizeTemplateType = (type, language) => {
    if (typeof type !== 'string') return type
    const dict = getNodeDictionary(language)
    return dict?.marketplaceTypes?.[type] ?? type
}

/** Translate a marketplace framework tag (Langchain / LlamaIndex). */
export const localizeFramework = (framework, language) => {
    if (typeof framework !== 'string') return framework
    const dict = getNodeDictionary(language)
    return dict?.marketplaceFrameworks?.[framework] ?? framework
}

/**
 * Translate the text of a Sticky Note node.
 *
 * Sticky notes shipped inside the marketplace templates are authored by
 * Flowise and are skipped during execution (`buildAgentflow.ts` filters
 * `stickyNoteAgentflow`), so translating them is display-only and safe.
 * Keyed by the exact English text: once a user edits a note the content no
 * longer matches and their own wording is shown unchanged.
 */
export const localizeStickyNote = (text, language) => {
    if (typeof text !== 'string') return text
    const dict = getNodeDictionary(language)
    return dict?.stickyNotes?.[text] ?? text
}

/** Translate a dropdown option label. Falls back to the English label. */
export const localizeOptionLabel = (label, language) => {
    if (typeof label !== 'string') return label
    const dict = getNodeDictionary(language)
    return dict?.options?.[label] ?? dict?.params?.[label] ?? label
}

/**
 * Hook returning the localizers bound to the active language.
 * Subscribes to language changes so components re-render on switch.
 */
export const useNodeLocale = () => {
    const { i18n } = useTranslation()
    const language = i18n.resolvedLanguage || i18n.language

    return useMemo(
        () => ({
            language,
            nodeLabel: (node) => localizeNodeLabel(node, language),
            nodeDescription: (node) => localizeNodeDescription(node, language),
            category: (category) => localizeCategory(category, language),
            paramLabel: (label) => localizeParamLabel(label, language),
            optionLabel: (label) => localizeOptionLabel(label, language),
            paramDescription: (description) => localizeParamDescription(description, language),
            credentialLabel: (credential) => localizeCredentialLabel(credential, language),
            credentialDescription: (credential) => localizeCredentialDescription(credential, language),
            template: (template) => localizeMarketplaceTemplate(template, language),
            templateDescription: (template) => localizeMarketplaceDescription(template, language),
            usecase: (usecase) => localizeUsecase(usecase, language),
            badge: (badge) => localizeBadge(badge, language),
            templateType: (type) => localizeTemplateType(type, language),
            framework: (framework) => localizeFramework(framework, language),
            stickyNote: (text) => localizeStickyNote(text, language)
        }),
        [language]
    )
}

export default useNodeLocale
