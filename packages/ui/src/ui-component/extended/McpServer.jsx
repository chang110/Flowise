import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

// material-ui
import { Button, Box, Typography, IconButton, OutlinedInput, InputAdornment, Alert } from '@mui/material'
import { IconX, IconCopy, IconRefresh } from '@tabler/icons-react'
import { useTheme } from '@mui/material/styles'

// Project import
import { StyledButton } from '@/ui-component/button/StyledButton'
import { SwitchInput } from '@/ui-component/switch/Switch'

// Hooks
import useConfirm from '@/hooks/useConfirm'
import useApi from '@/hooks/useApi'

// store
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction, SET_CHATFLOW } from '@/store/actions'
import useNotifier from '@/utils/useNotifier'

// API
import mcpServerApi from '@/api/mcpserver'
import chatflowsApi from '@/api/chatflows'

const McpServer = ({ dialogProps, onStatusChange }) => {
    const dispatch = useDispatch()
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const { confirm } = useConfirm()
    const { t } = useTranslation()

    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [mcpEnabled, setMcpEnabled] = useState(false)
    const [toolName, setToolName] = useState('')
    const [description, setDescription] = useState('')
    const [token, setToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [hasExistingConfig, setHasExistingConfig] = useState(false)

    const getMcpServerConfigApi = useApi(mcpServerApi.getMcpServerConfig)
    const [toolNameError, setToolNameError] = useState('')

    const chatflowId = dialogProps?.chatflow?.id
    const endpointUrl = chatflowId ? `${window.location.origin}/api/v1/mcp/${chatflowId}` : ''

    const validateToolName = (name) => {
        if (!name) return t('uic.mcpServer.toolNameRequired')
        if (name.length > 64) return t('uic.mcpServer.toolNameTooLong')
        if (!/^[A-Za-z0-9_-]+$/.test(name)) return t('uic.mcpServer.toolNameInvalid')
        return ''
    }

    const handleToolNameChange = (value) => {
        setToolName(value)
        setToolNameError(validateToolName(value))
    }

    const showSuccess = (message) => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'success',
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        })
    }

    const showError = (message) => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'error',
                persist: true,
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        })
    }

    const refreshChatflowStore = async () => {
        try {
            const resp = await chatflowsApi.getSpecificChatflow(dialogProps.chatflow.id)
            if (resp.data) {
                dispatch({ type: SET_CHATFLOW, chatflow: resp.data })
            }
        } catch {
            // silent fail — the store will refresh on next navigation
        }
    }

    const handleToggle = (enabled) => {
        setMcpEnabled(enabled)
    }

    const onSave = async () => {
        if (!dialogProps.chatflow?.id) return
        if (mcpEnabled && (toolNameError || !toolName.trim() || !description.trim())) return

        setLoading(true)
        try {
            if (mcpEnabled) {
                if (hasExistingConfig) {
                    const resp = await mcpServerApi.updateMcpServerConfig(dialogProps.chatflow.id, {
                        enabled: true,
                        toolName: toolName || undefined,
                        description: description || undefined
                    })
                    if (resp.data) {
                        setMcpEnabled(resp.data.enabled)
                        setToken(resp.data.token || '')
                        setToolName(resp.data.toolName || '')
                        setDescription(resp.data.description || '')
                        onStatusChange?.(resp.data.enabled)
                        showSuccess(t('uic.mcpServer.saved'))
                    }
                } else {
                    const resp = await mcpServerApi.createMcpServerConfig(dialogProps.chatflow.id, {
                        toolName: toolName || undefined,
                        description: description || undefined
                    })
                    if (resp.data) {
                        setMcpEnabled(resp.data.enabled)
                        setToken(resp.data.token || '')
                        setToolName(resp.data.toolName || '')
                        setDescription(resp.data.description || '')
                        setHasExistingConfig(true)
                        onStatusChange?.(resp.data.enabled)
                        showSuccess(t('uic.mcpServer.saved'))
                    }
                }
            } else {
                await mcpServerApi.deleteMcpServerConfig(dialogProps.chatflow.id)
                setMcpEnabled(false)
                onStatusChange?.(false)
                showSuccess(t('uic.mcpServer.disabled'))
            }
            await refreshChatflowStore()
        } catch (error) {
            showError(
                t('uic.mcpServer.saveFailed', {
                    error: typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data || error.message
                })
            )
        } finally {
            setLoading(false)
        }
    }

    const handleCopyUrl = (url) => {
        if (!url) return
        navigator.clipboard.writeText(url)
        showSuccess(t('uic.mcpServer.urlCopied'))
    }

    const handleRefreshCode = async () => {
        const confirmPayload = {
            title: t('uic.mcpServer.rotateTokenTitle'),
            description: t('uic.mcpServer.rotateTokenDescription'),
            confirmButtonName: t('uic.mcpServer.rotate'),
            cancelButtonName: t('common.cancel')
        }
        const isConfirmed = await confirm(confirmPayload)
        if (!isConfirmed) return
        if (!dialogProps.chatflow?.id) return

        setLoading(true)
        try {
            const resp = await mcpServerApi.refreshMcpToken(dialogProps.chatflow.id)
            if (resp.data) {
                setToken(resp.data.token || '')
                showSuccess(t('uic.mcpServer.tokenRotated'))
            }
            await refreshChatflowStore()
        } catch (error) {
            showError(
                t('uic.mcpServer.rotateFailed', {
                    error: typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data || error.message
                })
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (dialogProps.chatflow?.id) {
            getMcpServerConfigApi.request(dialogProps.chatflow.id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogProps])

    useEffect(() => {
        if (getMcpServerConfigApi.error) {
            showError(
                t('uic.mcpServer.loadFailed', {
                    error:
                        typeof getMcpServerConfigApi.error.response?.data === 'object'
                            ? getMcpServerConfigApi.error.response.data.message
                            : getMcpServerConfigApi.error.response?.data || getMcpServerConfigApi.error.message
                })
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getMcpServerConfigApi.error])

    useEffect(() => {
        if (getMcpServerConfigApi.data) {
            const enabled = getMcpServerConfigApi.data.enabled || false
            setMcpEnabled(enabled)
            setToolName(getMcpServerConfigApi.data.toolName || '')
            setDescription(getMcpServerConfigApi.data.description || '')
            setToken(getMcpServerConfigApi.data.token || '')
            setHasExistingConfig(!!getMcpServerConfigApi.data.token)
            onStatusChange?.(enabled)
        }
    }, [getMcpServerConfigApi.data]) // eslint-disable-line react-hooks/exhaustive-deps

    if (getMcpServerConfigApi.loading) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>{t('uic.mcpServer.loading')}</Typography>
            </Box>
        )
    }

    return (
        <>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <SwitchInput label={t('uic.mcpServer.expose')} onChange={handleToggle} value={mcpEnabled} disabled={loading} />
            </Box>

            {mcpEnabled && (
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Tool Name (required) */}
                    <Box>
                        <Typography sx={{ mb: 1 }}>
                            {t('uic.mcpServer.toolName')} <span style={{ color: theme.palette.error.main }}>*</span>
                        </Typography>
                        <OutlinedInput
                            fullWidth
                            size='small'
                            value={toolName}
                            onChange={(e) => handleToolNameChange(e.target.value)}
                            placeholder={t('uic.mcpServer.toolNamePlaceholder')}
                            error={!!toolNameError}
                            disabled={loading}
                        />
                        {toolNameError && (
                            <Typography variant='caption' color='error' sx={{ mt: 0.5, display: 'block' }}>
                                {toolNameError}
                            </Typography>
                        )}
                        <Typography
                            variant='caption'
                            sx={{ mt: 0.5, display: 'block', color: customization.isDarkMode ? theme.palette.grey[400] : 'text.secondary' }}
                        >
                            {t('uic.mcpServer.toolNameHint')}
                        </Typography>
                    </Box>

                    {/* Description (required) */}
                    <Box>
                        <Typography sx={{ mb: 1 }}>
                            {t('common.description')} <span style={{ color: theme.palette.error.main }}>*</span>
                        </Typography>
                        <OutlinedInput
                            fullWidth
                            size='small'
                            multiline
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('uic.mcpServer.descriptionPlaceholder')}
                            disabled={loading}
                        />
                        <Typography
                            variant='caption'
                            sx={{ mt: 0.5, display: 'block', color: customization.isDarkMode ? theme.palette.grey[400] : 'text.secondary' }}
                        >
                            {t('uic.mcpServer.descriptionHint')}
                        </Typography>
                    </Box>

                    {/* MCP Endpoint URL — visible only when has token */}
                    {token && (
                        <Box>
                            <Typography sx={{ mb: 1 }}>{t('uic.mcpServer.endpoint')}</Typography>
                            <OutlinedInput
                                fullWidth
                                size='small'
                                value={endpointUrl}
                                readOnly
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                }}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <IconButton
                                            size='small'
                                            onClick={() => handleCopyUrl(endpointUrl)}
                                            title={t('uic.mcpServer.copyUrl')}
                                            sx={{ color: customization.isDarkMode ? theme.palette.grey[300] : 'inherit' }}
                                        >
                                            <IconCopy size={18} />
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                            <Typography
                                variant='caption'
                                sx={{
                                    mt: 0.5,
                                    display: 'block',
                                    color: customization.isDarkMode ? theme.palette.grey[400] : 'text.secondary'
                                }}
                            >
                                {t('uic.mcpServer.endpointHint')}
                            </Typography>

                            <Typography sx={{ mb: 1, mt: 2 }}>{t('uic.mcpServer.token')}</Typography>
                            <OutlinedInput
                                fullWidth
                                size='small'
                                value={token}
                                readOnly
                                type='password'
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                }}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <IconButton
                                            size='small'
                                            onClick={() => {
                                                navigator.clipboard.writeText(token)
                                                showSuccess(t('uic.mcpServer.tokenCopied'))
                                            }}
                                            title={t('uic.mcpServer.copyToken')}
                                            sx={{ color: customization.isDarkMode ? theme.palette.grey[300] : 'inherit' }}
                                        >
                                            <IconCopy size={18} />
                                        </IconButton>
                                        <IconButton
                                            size='small'
                                            onClick={handleRefreshCode}
                                            title={t('uic.mcpServer.rotateToken')}
                                            disabled={loading}
                                            sx={{ color: customization.isDarkMode ? theme.palette.grey[300] : 'inherit' }}
                                        >
                                            <IconRefresh size={18} />
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                            <Alert
                                severity='info'
                                sx={{
                                    mt: 1.5,
                                    ...(customization.isDarkMode && {
                                        bgcolor: 'rgba(41, 182, 246, 0.08)',
                                        color: theme.palette.grey[300],
                                        '& .MuiAlert-icon': {
                                            color: theme.palette.info.light
                                        }
                                    })
                                }}
                            >
                                {t('uic.mcpServer.authHint')}{' '}
                                <code
                                    style={{
                                        display: 'block',
                                        color: customization.isDarkMode ? theme.palette.grey[200] : undefined
                                    }}
                                >
                                    Authorization: Bearer {'<token>'}
                                </code>
                            </Alert>
                        </Box>
                    )}
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mt: 2 }}>
                <StyledButton
                    variant='contained'
                    disabled={loading || (mcpEnabled && (!!toolNameError || !toolName.trim() || !description.trim()))}
                    onClick={onSave}
                    sx={{ minWidth: 100 }}
                >
                    {loading ? t('uic.mcpServer.saving') : t('common.save')}
                </StyledButton>
            </Box>
        </>
    )
}

McpServer.propTypes = {
    dialogProps: PropTypes.object,
    onStatusChange: PropTypes.func
}

export default McpServer
