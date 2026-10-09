import { createPortal } from 'react-dom'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useTranslation } from 'react-i18next'
import useConfirm from '@/hooks/useConfirm'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { translateLabel } from '@/i18n/translateLabel'

const ConfirmDialog = () => {
    const { onConfirm, onCancel, confirmState } = useConfirm()
    const { t } = useTranslation()
    const portalElement = document.getElementById('portal')

    const component = confirmState.show ? (
        <Dialog
            fullWidth
            maxWidth='xs'
            open={confirmState.show}
            onClose={onCancel}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='alert-dialog-title'>
                {confirmState.title}
            </DialogTitle>
            <DialogContent>
                <span>{confirmState.description}</span>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{translateLabel(confirmState.cancelButtonName, t)}</Button>
                <StyledButton variant='contained' onClick={onConfirm}>
                    {translateLabel(confirmState.confirmButtonName, t)}
                </StyledButton>
            </DialogActions>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

export default ConfirmDialog
