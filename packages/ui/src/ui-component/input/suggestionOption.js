import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import SuggestionList from './SuggestionList'
import variablesApi from '@/api/variables'
import i18n from '@/i18n'

/**
 * Workaround for the current typing incompatibility between Tippy.js and Tiptap
 * Suggestion utility.
 *
 * @see https://github.com/ueberdosis/tiptap/issues/2795#issuecomment-1160623792
 *
 * Adopted from
 * https://github.com/Doist/typist/blob/a1726a6be089e3e1452def641dfcfc622ac3e942/stories/typist-editor/constants/suggestions.ts#L169-L186
 */
const DOM_RECT_FALLBACK = {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON() {
        return {}
    }
}

// Cache for storing variables
let cachedVariables = []

// Function to fetch variables
const fetchVariables = async () => {
    try {
        const response = await variablesApi.getAllVariables()
        cachedVariables = response.data || []
        return cachedVariables
    } catch (error) {
        console.error('Failed to fetch variables:', error)
        return []
    }
}

export const suggestionOptions = (
    availableNodesForVariable,
    availableState,
    acceptNodeOutputAsVariable,
    nodes,
    nodeData,
    isNodeInsideInteration
) => ({
    char: '{{',
    items: async ({ query }) => {
        const defaultItems = [
            {
                id: 'question',
                mentionLabel: 'question',
                description: i18n.t('uic.suggestions.question'),
                category: i18n.t('uic.suggestionCategories.chatContext')
            },
            {
                id: 'chat_history',
                mentionLabel: 'chat_history',
                description: i18n.t('uic.suggestions.chatHistory'),
                category: i18n.t('uic.suggestionCategories.chatContext')
            },
            {
                id: 'current_date_time',
                mentionLabel: 'current_date_time',
                description: i18n.t('uic.suggestions.currentDateTime'),
                category: i18n.t('uic.suggestionCategories.chatContext')
            },
            {
                id: 'runtime_messages_length',
                mentionLabel: 'runtime_messages_length',
                description: i18n.t('uic.suggestions.runtimeMessagesLength'),
                category: i18n.t('uic.suggestionCategories.chatContext')
            },
            {
                id: 'loop_count',
                mentionLabel: 'loop_count',
                description: i18n.t('uic.suggestions.loopCount'),
                category: i18n.t('uic.suggestionCategories.chatContext')
            },
            {
                id: 'file_attachment',
                mentionLabel: 'file_attachment',
                description: i18n.t('uic.suggestions.fileAttachment'),
                category: i18n.t('uic.suggestionCategories.chatContext')
            },
            {
                id: '$flow.sessionId',
                mentionLabel: '$flow.sessionId',
                description: i18n.t('uic.suggestions.sessionId'),
                category: i18n.t('uic.suggestionCategories.flowVariables')
            },
            {
                id: '$flow.chatId',
                mentionLabel: '$flow.chatId',
                description: i18n.t('uic.suggestions.chatId'),
                category: i18n.t('uic.suggestionCategories.flowVariables')
            },
            {
                id: '$flow.chatflowId',
                mentionLabel: '$flow.chatflowId',
                description: i18n.t('uic.suggestions.chatflowId'),
                category: i18n.t('uic.suggestionCategories.flowVariables')
            }
        ]

        const stateItems = (availableState || []).map((state) => ({
            id: `$flow.state.${state.key}`,
            mentionLabel: `$flow.state.${state.key}`,
            category: i18n.t('uic.suggestionCategories.flowState')
        }))

        if (isNodeInsideInteration) {
            defaultItems.unshift({
                id: '$iteration',
                mentionLabel: '$iteration',
                description: i18n.t('uic.suggestions.iteration'),
                category: i18n.t('uic.suggestionCategories.iteration')
            })
        }

        // Add output option if acceptNodeOutputAsVariable is true
        if (acceptNodeOutputAsVariable) {
            defaultItems.unshift({
                id: 'output',
                mentionLabel: 'output',
                description: i18n.t('uic.suggestions.output'),
                category: i18n.t('uic.suggestionCategories.nodeOutputs')
            })

            const structuredOutputs = nodeData?.inputs?.llmStructuredOutput ?? nodeData?.inputs?.agentStructuredOutput ?? []
            if (structuredOutputs && structuredOutputs.length > 0) {
                structuredOutputs.forEach((item) => {
                    defaultItems.unshift({
                        id: `output.${item.key}`,
                        mentionLabel: `output.${item.key}`,
                        description: `${item.description}`,
                        category: i18n.t('uic.suggestionCategories.nodeOutputs')
                    })
                })
            }
        }

        // Fetch variables if cache is empty
        if (cachedVariables.length === 0) {
            await fetchVariables()
        }

        const variableItems = cachedVariables.map((variable) => ({
            id: `$vars.${variable.name}`,
            mentionLabel: `$vars.${variable.name}`,
            description: i18n.t('uic.suggestions.variable', { value: variable.value, type: variable.type }),
            category: i18n.t('uic.suggestionCategories.customVariables')
        }))

        const startAgentflowNode = nodes.find((node) => node.data.name === 'startAgentflow')
        const { webhookQueryParams, webhookBodyParams, webhookHeaderParams } = startAgentflowNode?.data?.inputs ?? {}
        const startInputType = startAgentflowNode?.data?.inputs?.startInputType
        const scheduleInputMode = startAgentflowNode?.data?.inputs?.scheduleInputMode
        const activeFormInputTypes =
            startInputType === 'scheduleInput' && scheduleInputMode === 'form'
                ? startAgentflowNode?.data?.inputs?.scheduleFormInputTypes
                : startAgentflowNode?.data?.inputs?.formInputTypes

        let formItems = []
        if (activeFormInputTypes) {
            formItems = (activeFormInputTypes || []).map((input) => ({
                id: `$form.${input.name}`,
                mentionLabel: `$form.${input.name}`,
                description: i18n.t('uic.suggestions.formInput', { label: input.label }),
                category: i18n.t('uic.suggestionCategories.formInputs')
            }))
        }

        let webhookQueryItems = []
        if (webhookQueryParams) {
            webhookQueryItems = webhookQueryParams.map((input) => ({
                id: `$webhook.query.${input.name}`,
                mentionLabel: `$webhook.query.${input.name}`,
                description: i18n.t('uic.suggestions.webhookQuery', { name: input.name }),
                category: i18n.t('uic.suggestionCategories.webhookInputs')
            }))
        }

        let webhookItems = []
        if (webhookBodyParams) {
            webhookItems = webhookBodyParams.map((input) => ({
                id: `$webhook.body.${input.name}`,
                mentionLabel: `$webhook.body.${input.name}`,
                description: i18n.t('uic.suggestions.webhookBody', { name: input.name }),
                category: i18n.t('uic.suggestionCategories.webhookInputs')
            }))
        }

        let webhookHeaderItems = []
        if (webhookHeaderParams) {
            webhookHeaderItems = webhookHeaderParams.map((input) => ({
                id: `$webhook.headers.${input.name}`,
                mentionLabel: `$webhook.headers.${input.name}`,
                description: i18n.t('uic.suggestions.webhookHeader', { name: input.name }),
                category: i18n.t('uic.suggestionCategories.webhookInputs')
            }))
        }

        const nodeItems = (availableNodesForVariable || []).map((node) => {
            const selectedOutputAnchor = node.data.outputAnchors?.[0]?.options?.find((ancr) => ancr.name === node.data.outputs['output'])

            return {
                id: `${node.id}`,
                mentionLabel: node.data.inputs.chainName ?? node.data.inputs.functionName ?? node.data.inputs.variableName ?? node.data.id,
                description:
                    node.data.name === 'ifElseFunction'
                        ? node.data.description
                        : i18n.t('uic.suggestions.outputFrom', {
                              output: selectedOutputAnchor?.label ?? i18n.t('uic.suggestions.outputAnchor'),
                              node: node.data.label
                          }),
                category: i18n.t('uic.suggestionCategories.nodeOutputs')
            }
        })

        const allItems = [
            ...defaultItems,
            ...formItems,
            ...webhookQueryItems,
            ...webhookItems,
            ...webhookHeaderItems,
            ...nodeItems,
            ...stateItems,
            ...variableItems
        ]

        return allItems.filter(
            (item) => item.mentionLabel.toLowerCase().includes(query.toLowerCase()) || item.id.toLowerCase().includes(query.toLowerCase())
        )
    },
    render: () => {
        let component
        let popup

        return {
            onStart: (props) => {
                component = new ReactRenderer(SuggestionList, {
                    props,
                    editor: props.editor
                })

                popup = tippy('body', {
                    getReferenceClientRect: () => props.clientRect?.() ?? DOM_RECT_FALLBACK,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start'
                })[0]
            },

            onUpdate(props) {
                component?.updateProps(props)

                popup?.setProps({
                    getReferenceClientRect: () => props.clientRect?.() ?? DOM_RECT_FALLBACK
                })
            },

            onKeyDown(props) {
                if (props.event.key === 'Escape') {
                    popup?.hide()
                    return true
                }

                if (!component?.ref) {
                    return false
                }

                return component.ref.onKeyDown(props)
            },

            onExit() {
                popup?.destroy()
                component?.destroy()

                // Remove references to the old popup and component upon destruction/exit.
                // (This should prevent redundant calls to `popup.destroy()`, which Tippy
                // warns in the console is a sign of a memory leak, as the `suggestion`
                // plugin seems to call `onExit` both when a suggestion menu is closed after
                // a user chooses an option, *and* when the editor itself is destroyed.)
                popup = undefined
                component = undefined
            }
        }
    }
})

// Export function to refresh variables cache
export const refreshVariablesCache = () => {
    return fetchVariables()
}
