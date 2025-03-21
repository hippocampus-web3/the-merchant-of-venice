export const mapHorizonMilliseconds = {
    '8h': Number(process.env.EIGHT_HOURS_IN_MILLISECONDS) || 28800000,
    '16h': Number(process.env.SIXTEEN_HOURS_IN_MILLISECONDS) || 57600000,
    '20h': Number(process.env.TWENTY_HOURS_IN_MILLISECONDS) || 72000000,
}

export const mapSizePercentage = {
    'small': 1, // 100%
    'medium': 2, // 200%
    'large': 3, // 300%
}