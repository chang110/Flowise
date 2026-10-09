/**
 * Helper to translate the short, reusable button labels that are passed around
 * as plain English strings (e.g. `confirmButtonName: 'Delete'`).
 *
 * Labels that are not part of this mapping are returned unchanged so that
 * custom/dynamic text keeps working exactly as before.
 */

const COMMON_LABEL_KEYS = {
    ok: 'common.ok',
    cancel: 'common.cancel',
    save: 'common.save',
    delete: 'common.delete',
    add: 'common.add',
    edit: 'common.edit',
    confirm: 'common.confirm',
    close: 'common.close',
    back: 'common.back',
    update: 'common.update',
    create: 'common.create',
    submit: 'common.submit',
    reset: 'common.reset',
    refresh: 'common.refresh',
    yes: 'common.yes',
    no: 'common.no',
    export: 'common.export',
    import: 'common.import',
    duplicate: 'common.duplicate',
    copy: 'common.copy',
    view: 'common.view',
    share: 'common.share',
    search: 'common.search'
}

export const getLabelKey = (label) => {
    if (typeof label !== 'string') return null
    return COMMON_LABEL_KEYS[label.trim().toLowerCase()] || null
}

export const translateLabel = (label, t) => {
    const key = getLabelKey(label)
    return key ? t(key) : label
}

export default translateLabel
