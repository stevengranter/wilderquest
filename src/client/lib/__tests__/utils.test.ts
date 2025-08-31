import { cn } from '../utils'

describe('cn utility function', () => {
    it('should merge class names correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle undefined and null values', () => {
        expect(cn('class1', undefined, 'class2', null)).toBe('class1 class2')
    })

    it('should handle array inputs', () => {
        expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })

    it('should handle mixed inputs', () => {
        expect(cn('class1', ['class2', 'class3'], undefined)).toBe(
            'class1 class2 class3'
        )
    })

    it('should handle empty inputs', () => {
        expect(cn()).toBe('')
        expect(cn('', 'class1', '')).toBe('class1')
    })

    it('should handle Tailwind class conflicts (last class wins)', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })
})
