import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

// material-ui
import { Avatar, ButtonBase, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// assets
import { IconLanguage } from '@tabler/icons-react'

// i18n
import { LANGUAGES, normalizeLanguage } from '@/i18n'

// ==============================|| HEADER - LANGUAGE SWITCHER ||============================== //

const LanguageSwitcher = ({ sx = {} }) => {
    const theme = useTheme()
    const { i18n, t } = useTranslation()

    const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language)
    const current = LANGUAGES.find((lang) => lang.code === currentLanguage) || LANGUAGES[0]
    const next = LANGUAGES.find((lang) => lang.code !== currentLanguage) || LANGUAGES[0]

    const toggleLanguage = () => {
        i18n.changeLanguage(next.code)
    }

    return (
        <Tooltip title={currentLanguage === 'zh-CN' ? t('header.switchToEnglish') : t('header.switchToChinese')}>
            <ButtonBase sx={{ borderRadius: '12px', overflow: 'hidden', ...sx }} onClick={toggleLanguage} aria-label={t('header.language')}>
                <Avatar
                    variant='rounded'
                    sx={{
                        ...theme.typography.mediumAvatar,
                        width: 'auto',
                        minWidth: 40,
                        px: 1,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all .2s ease-in-out',
                        background: theme.palette.secondary.light,
                        color: theme.palette.secondary.dark,
                        '&:hover': {
                            background: theme.palette.secondary.dark,
                            color: theme.palette.secondary.light
                        }
                    }}
                    color='inherit'
                >
                    <IconLanguage stroke={1.5} size='1.1rem' />
                    <Typography sx={{ ml: 0.5, fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1 }}>{current.shortLabel}</Typography>
                </Avatar>
            </ButtonBase>
        </Tooltip>
    )
}

LanguageSwitcher.propTypes = {
    sx: PropTypes.object
}

export default LanguageSwitcher
