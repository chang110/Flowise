/**
 * Detect what a file actually contains from its magic bytes.
 *
 * `officeparser` only supports the modern OOXML formats (`.docx`, `.pptx`,
 * `.xlsx`, `.odt/.odp/.ods`, `.pdf`). When it is handed anything else it
 * reports a generic "Error occured while reading the file buffers" or
 * "extension unsupported" message that gives the user no clue what went wrong.
 *
 * Inspecting the leading bytes lets the document loaders explain the real
 * problem — e.g. "this is a legacy .doc file" or "this is just plain text".
 */
export type FileSignature =
    | 'ooxml' // ZIP container — .docx / .pptx / .xlsx / .odt / .odp / .ods
    | 'legacyOffice' // OLE2 / Compound File Binary — .doc / .ppt / .xls (97-2003)
    | 'rtf'
    | 'pdf'
    | 'html'
    | 'text'
    | 'empty'
    | 'unknown'

export const detectFileSignature = (raw: Buffer): FileSignature => {
    if (!raw || raw.length === 0) return 'empty'

    // ZIP container. A modern Office file is a ZIP archive.
    if (raw.length >= 4 && raw[0] === 0x50 && raw[1] === 0x4b && (raw[2] === 0x03 || raw[2] === 0x05 || raw[2] === 0x07)) {
        return 'ooxml'
    }

    // OLE2 / Compound File Binary — legacy .doc, .ppt, .xls
    if (raw.length >= 8 && raw[0] === 0xd0 && raw[1] === 0xcf && raw[2] === 0x11 && raw[3] === 0xe0) {
        return 'legacyOffice'
    }

    // RTF
    if (raw.length >= 5 && raw.toString('latin1', 0, 5) === '{\\rtf') return 'rtf'

    // PDF
    if (raw.length >= 4 && raw.toString('latin1', 0, 4) === '%PDF') return 'pdf'

    // Text-like payloads (skip a UTF-8 BOM before inspecting)
    const hasBom = raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf
    const text = (hasBom ? raw.subarray(3) : raw).toString('utf8')
    if (/^\s*(<!doctype html|<html|<!--)/i.test(text)) return 'html'
    if (/^[\x09\x0a\x0d\x20-\x7e\u00a0-\uffff]*$/.test(text)) return 'text'

    return 'unknown'
}

/**
 * Human readable explanation for a file that could not be parsed as `expectedFormat`.
 *
 * @param signature   Result of {@link detectFileSignature}
 * @param expectedFormat   e.g. '.docx' — used in the messages
 * @param labelForFormat   e.g. 'Word' — used in the messages
 * @param suggestionLoader Optional name of a loader the user should use instead
 */
export const describeFileSignature = (
    signature: FileSignature,
    expectedFormat: string,
    labelForFormat: string,
    suggestionLoader?: string
): string => {
    const suggestion = suggestionLoader ? ` Please use the ${suggestionLoader} instead.` : ''

    switch (signature) {
        case 'empty':
            return `Failed to parse ${labelForFormat} file: the uploaded file is empty (0 bytes). Please upload a valid ${expectedFormat} file.`
        case 'legacyOffice':
            return `Failed to parse ${labelForFormat} file: this is a legacy Office 97-2003 file, which is not supported. Please open it in Word/WPS/LibreOffice and save it as ${expectedFormat}, then upload it again.`
        case 'rtf':
            return `Failed to parse ${labelForFormat} file: this is an RTF (.rtf) document, not a ${expectedFormat} file. Please save it as ${expectedFormat} and upload it again.`
        case 'pdf':
            return `Failed to parse ${labelForFormat} file: this is a PDF document, not a ${expectedFormat} file.${
                suggestion || ' Please upload the original file instead.'
            }`
        case 'html':
            return `Failed to parse ${labelForFormat} file: this file contains HTML, not ${labelForFormat} document data. It is likely a web page saved with a ${expectedFormat} extension. Please export a real ${expectedFormat} file from Word/WPS/LibreOffice.`
        case 'text':
            return `Failed to parse ${labelForFormat} file: this file contains plain text, not ${labelForFormat} document data. It is likely a .txt/.md file renamed to ${expectedFormat}. Please upload the original ${expectedFormat} file.`
        default:
            return `Failed to parse ${labelForFormat} file: the file format could not be recognised as a valid ${expectedFormat} document. Please verify the file is not corrupted and upload it again.`
    }
}

/**
 * Message used when the container is valid but cannot be read as the expected format,
 * e.g. a plain .zip archive renamed to .docx, or a truncated Office file.
 */
export const describeUnreadableArchive = (labelForFormat: string, expectedFormat: string): string =>
    `Failed to parse ${labelForFormat} file: the file looks like a ZIP archive but could not be read as a ${expectedFormat} document. It may be a plain .zip archive, or a ${labelForFormat} file that is corrupted or truncated. Please verify the file and upload it again.`

/**
 * Message used when a file parses successfully but yields no usable text.
 */
export const describeEmptyContent = (labelForFormat: string): string =>
    `Failed to parse ${labelForFormat} file: no readable text was found. The document may be empty or contain only images, tables or other non-text content.`
