import { Document } from '@langchain/core/documents'
import { BufferLoader } from '@langchain/classic/document_loaders/fs/buffer'
import { parseOfficeAsync } from 'officeparser'
import { detectFileSignature, describeFileSignature, describeUnreadableArchive, describeEmptyContent } from '../../../src/fileSignature'

/**
 * Document loader that uses officeparser to load PowerPoint documents.
 *
 * Each slide is parsed into a separate Document with metadata including
 * slide number and extracted text content.
 */
export class PowerpointLoader extends BufferLoader {
    attributes: { name: string; description: string; type: string }[] = []

    constructor(filePathOrBlob: string | Blob) {
        super(filePathOrBlob)
        this.attributes = []
    }

    /**
     * Parse PowerPoint document
     *
     * @param raw Raw data Buffer
     * @param metadata Document metadata
     * @returns Array of Documents
     */
    async parse(raw: Buffer, metadata: Document['metadata']): Promise<Document[]> {
        const result: Document[] = []

        this.attributes = [
            { name: 'slideNumber', description: 'Slide number', type: 'number' },
            { name: 'documentType', description: 'Type of document', type: 'string' }
        ]

        // Fail fast with an actionable message instead of officeparser's generic
        // "error reading the file buffers" / "extension unsupported" errors.
        const signature = detectFileSignature(raw)
        if (signature !== 'ooxml') {
            throw new Error(describeFileSignature(signature, '.pptx', 'PowerPoint', 'PDF File loader'))
        }

        let data: unknown
        try {
            // Use officeparser to extract text from PowerPoint
            data = await parseOfficeAsync(raw)
        } catch (error) {
            console.error('Error parsing PowerPoint file:', error)
            // officeparser reports "extension unsupported" for any ZIP it cannot
            // read as OOXML, which is misleading for a .pptx upload.
            throw new Error(describeUnreadableArchive('PowerPoint', '.pptx'))
        }

        if (typeof data !== 'string' || !data.trim()) {
            throw new Error(describeEmptyContent('PowerPoint'))
        }

        // Split content by common slide separators or use the entire content as one document
        const slides = this.splitIntoSlides(data)

        slides.forEach((slideContent, index) => {
            if (slideContent.trim()) {
                result.push({
                    pageContent: slideContent.trim(),
                    metadata: {
                        slideNumber: index + 1,
                        documentType: 'powerpoint',
                        ...metadata
                    }
                })
            }
        })

        if (result.length === 0) {
            throw new Error(describeEmptyContent('PowerPoint'))
        }

        return result
    }

    /**
     * Split content into slides based on common patterns
     * This is a heuristic approach since officeparser returns plain text
     */
    private splitIntoSlides(content: string): string[] {
        // Try to split by common slide patterns
        const slidePatterns = [
            /\n\s*Slide\s+\d+/gi,
            /\n\s*Page\s+\d+/gi,
            /\n\s*\d+\s*\/\s*\d+/gi,
            /\n\s*_{3,}/g, // Underscores as separators
            /\n\s*-{3,}/g // Dashes as separators
        ]

        let slides: string[] = []

        // Try each pattern and use the one that creates the most reasonable splits
        for (const pattern of slidePatterns) {
            const potentialSlides = content.split(pattern)
            if (potentialSlides.length > 1 && potentialSlides.length < 100) {
                // Reasonable number of slides
                slides = potentialSlides
                break
            }
        }

        // If no good pattern found, split by double newlines as a fallback
        if (slides.length === 0) {
            slides = content.split(/\n\s*\n\s*\n/)
        }

        // If still no good split, treat entire content as one slide
        if (slides.length === 0 || slides.every((slide) => slide.trim().length < 10)) {
            slides = [content]
        }

        return slides.filter((slide) => slide.trim().length > 0)
    }
}
