# i18n locale fragments

`en.json` / `zh-CN.json` are the **base** dictionaries. Do not edit them from
parallel work streams — instead add a fragment file here:

-   `locales/en/<module>.json`
-   `locales/zh-CN/<module>.json`

Fragment shape (top-level namespaces, merged on top of the base dictionaries):

```json
{
    "<namespace>": {
        "someKey": "Some text"
    }
}
```

All fragments are auto-loaded by `src/i18n/index.js` via `import.meta.glob`.
Fragments are sorted by filename and merged last-wins per key, so two fragments
must not define the same key in the same namespace.
