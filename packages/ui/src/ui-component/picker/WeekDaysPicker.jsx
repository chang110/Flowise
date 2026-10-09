import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Box, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const DEFAULT_DAYS = [
    { key: 'mon', value: '1' },
    { key: 'tue', value: '2' },
    { key: 'wed', value: '3' },
    { key: 'thu', value: '4' },
    { key: 'fri', value: '5' },
    { key: 'sat', value: '6' },
    { key: 'sun', value: '7' }
]

export const WeekDaysPicker = ({ value, options, onChange, disabled = false }) => {
    const theme = useTheme()
    const { t } = useTranslation()
    const days = options?.length
        ? options.map((o) => ({ label: o.label, value: o.name }))
        : DEFAULT_DAYS.map((d) => ({ label: t(`uic.weekDays.${d.key}`), value: d.value }))

    const parseValue = (val) => {
        if (!val) return []
        if (Array.isArray(val)) return val
        if (typeof val === 'string')
            return val
                .split(',')
                .map((token) => token.trim())
                .filter(Boolean)
        return []
    }

    const [selected, setSelected] = useState(parseValue(value))

    useEffect(() => {
        setSelected(parseValue(value))
    }, [value])

    const toggle = (dayValue) => {
        if (disabled) return
        let next
        if (selected.includes(dayValue)) {
            next = selected.filter((d) => d !== dayValue)
        } else {
            next = [...selected, dayValue]
        }
        // Sort by the days array order
        next.sort((a, b) => days.findIndex((d) => d.value === a) - days.findIndex((d) => d.value === b))
        setSelected(next)
        onChange(next.join(','))
    }

    return (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {days.map((day) => {
                const isSelected = selected.includes(day.value)
                return (
                    <Chip
                        key={day.value}
                        label={day.label}
                        size='small'
                        disabled={disabled}
                        onClick={() => toggle(day.value)}
                        sx={{
                            cursor: disabled ? 'default' : 'pointer',
                            fontWeight: isSelected ? 600 : 400,
                            borderWidth: '1.5px',
                            borderStyle: 'solid',
                            borderColor: isSelected ? theme.palette.primary.main : theme.palette.grey[400],
                            backgroundColor: isSelected ? theme.palette.primary.main + '20' : 'transparent',
                            color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                            '&:hover': disabled
                                ? {}
                                : {
                                      backgroundColor: isSelected ? theme.palette.primary.main + '35' : theme.palette.grey[200]
                                  }
                        }}
                    />
                )
            })}
        </Box>
    )
}

WeekDaysPicker.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    options: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            name: PropTypes.string
        })
    ),
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool
}
