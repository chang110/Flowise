import { Document } from '@langchain/core/documents'
import { BufferLoader } from '@langchain/classic/document_loaders/fs/buffer'
import { parseOfficeAsync } from 'officeparser'
import { detectFileSignature, describeFileSignature, describeUnreadableArchive, describeEmptyContent } from '../../../src/fileSignature'

/**
 * Document loader that uses officeparser to load Word documents.
 *
 * The document is parsed into a single Document with metadata including
 * document type and extracted text content.
 */
export class WordLoader extends BufferLoader {
    attributes: { name: string; description: string; type: string }[] = []

    constructor(filePathOrBlob: string | Blob) {
        super(filePathOrBlob)
        this.attributes = []
    }

    /**
     * Parse Word document
     *
     * @param raw Raw data Buffer
     * @param metadata Document metadata
     * @returns Array of Documents
     */
    async parse(raw: Buffer, metadata: Document['metadata']): Promise<Document[]> {
        const result: Document[] = []

        this.attributes = [
            { name: 'documentType', description: 'Type of document', type: 'string' },
            { name: 'pageCount', description: 'Number of pages/sections', type: 'number' }
        ]

        // Fail fast with an actionable message instead of officeparser's generic
        // "error reading the file buffers" / "extension unsupported" errors.
        const signature = detectFileSignature(raw)
        if (signature !== 'ooxml') {
            throw new Error(describeFileSignature(signature, '.docx', 'Word', 'PDF File loader'))
        }

        let data: unknown
        try {
            // Use officeparser to extract text from Word document
            data = await parseOfficeAsync(raw)
        } catch (error) {
            console.error('Error parsing Word file:', error)
            // officeparser reports "extension unsupported" for any ZIP it cannot
            // read as OOXML, which is misleading for a .docx upload.
            throw new Error(describeUnreadableArchive('Word', '.docx'))
        }

        if (typeof data !== 'string' || !data.trim()) {
            throw new Error(describeEmptyContent('Word'))
        }

        // Split content by common page/section separators
        const sections = this.splitIntoSections(data)

        sections.forEach((sectionContent, index) => {
            if (sectionContent.trim()) {
                result.push({
                    pageContent: sectionContent.trim(),
                    metadata: {
                        documentType: 'word',
                        pageNumber: index + 1,
                        ...metadata
                    }
                })
            }
        })

        if (result.length === 0) {
            throw new Error(describeEmptyContent('Word'))
        }

        return result
    }

    /**
     * Split content into sections based on common patterns
     * This is a heuristic approach since officeparser returns plain text
     */
    private splitIntoSections(content: string): string[] {
        // Try to split by common section patterns
        const sectionPatterns = [
            /\n\s*Page\s+\d+/gi,
            /\n\s*Section\s+\d+/gi,
            /\n\s*Chapter\s+\d+/gi,
            /\n\s*\d+\.\s+/gi, // Numbered sections like "1. ", "2. "
            /\n\s*[A-Z][A-Z\s]{2,}\n/g, // ALL CAPS headings
            /\n\s*_{5,}/g, // Long underscores as separators
            /\n\s*-{5,}/g // Long dashes as separators
        ]

        let sections: string[] = []

        // Try each pattern and use the one that creates the most reasonable splits
        for (const pattern of sectionPatterns) {
            const potentialSections = content.split(pattern)
            if (potentialSections.length > 1 && potentialSections.length < 50) {
                // Reasonable number of sections
                sections = potentialSections
                break
            }
        }

        // If no good pattern found, split by multiple newlines as a fallback
        if (sections.length === 0) {
            sections = content.split(/\n\s*\n\s*\n\s*\n/)
        }

        // If still no good split, split by double newlines
        if (sections.length === 0 || sections.every((section) => section.trim().length < 20)) {
            sections = content.split(/\n\s*\n\s*\n/)
        }

        // If still no good split, treat entire content as one section
        if (sections.length === 0 || sections.every((section) => section.trim().length < 10)) {
            sections = [content]
        }

        return sections.filter((section) => section.trim().length > 0)
    }
}
