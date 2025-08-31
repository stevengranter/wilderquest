// Simple TypeScript test without imports
describe('Simple TypeScript Test', () => {
    it('should work with TypeScript', () => {
        const message: string = 'Hello, TypeScript!'
        expect(message).toBe('Hello, TypeScript!')
    })

    it('should handle basic types', () => {
        const number: number = 42
        const boolean: boolean = true
        const array: number[] = [1, 2, 3]

        expect(number).toBe(42)
        expect(boolean).toBe(true)
        expect(array).toHaveLength(3)
    })
})
