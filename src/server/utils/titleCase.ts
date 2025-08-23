export function titleCase(str: string): string {
    if (!str) return str
    
    const minorWords = new Set([
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet',
    ])

    // Split by common separators and handle each word
    const words = str.split(/[\s\-_]+/)
    
    return words
        .map((word, index, array) => {
            if (!word) return word
            
            const lowerWord = word.toLowerCase()
            
            // Capitalize if it's the first word, last word, or not a minor word
            if (index === 0 || index === array.length - 1 || !minorWords.has(lowerWord)) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            } else {
                return lowerWord
            }
        })
        .join(' ')
}
