import _ from 'lodash'

export default function titleCase(str: string): string {
    const minorWords = new Set([
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet',
    ])

    // Use _.startCase to get initial word capitalization and handling of separators
    const startedCase = _.startCase(str)

    return startedCase
        .split(' ')
        .map((word, index, array) => {
            // Convert to lowercase to check against minorWords set
            const lowerWord = word.toLowerCase()

            // Capitalize if it's the first word, last word, or not a minor word
            if (index === 0 || index === array.length - 1 || !minorWords.has(lowerWord)) {
                return word // Keep the already capitalized word from _.startCase
            } else {
                return lowerWord // Convert minor words to lowercase
            }
        })
        .join(' ')
}
