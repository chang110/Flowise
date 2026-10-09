import { Box, Skeleton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { StyledButton } from '@/ui-component/button/StyledButton'

const TrialInfo = ({ billingPortalUrl, isLoading, paymentMethodExists, trialDaysLeft }) => {
    const theme = useTheme()
    const { t } = useTranslation()

    return (
        <Box
            sx={{
                p: '24px',
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'start',
                gap: 2,
                borderTop: 1,
                borderBottom: '1px solid',
                borderColor: theme.palette.grey[900] + 25,
                width: '100%'
            }}
        >
            {isLoading ? (
                <Box display='flex' flexDirection='column' gap={1} sx={{ width: '100%' }}>
                    <Skeleton width='100%' height={32} />
                    <Skeleton width='100%' height={32} />
                </Box>
            ) : (
                <>
                    <Typography variant='body1' color='inherit' sx={{ lineHeight: '1.5' }}>
                        {t('rem.trialThereAre')}{' '}
                        <Typography variant='' color='error'>
                            {t('rem.trialDaysLeft', { days: trialDaysLeft })}
                        </Typography>{' '}
                        {t('rem.trialInYour')} {!paymentMethodExists ? t('rem.trialUpdatePayment') : ''}
                    </Typography>
                    {!paymentMethodExists && (
                        <a href={billingPortalUrl} target='_blank' rel='noreferrer' style={{ width: '100%' }}>
                            <StyledButton variant='contained' sx={{ borderRadius: 2, height: 32, width: '100%' }}>
                                {t('rem.updatePaymentMethod')}
                            </StyledButton>
                        </a>
                    )}
                </>
            )}
        </Box>
    )
}

TrialInfo.propTypes = {
    billingPortalUrl: PropTypes.string,
    isLoading: PropTypes.bool,
    paymentMethodExists: PropTypes.bool,
    trialDaysLeft: PropTypes.number
}

export default TrialInfo
