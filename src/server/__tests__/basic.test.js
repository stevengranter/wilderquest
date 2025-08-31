// Basic test to verify Jest is working
describe('Basic Test Suite', () => {
    it('should pass a simple test', () => {
        expect(1 + 1).toBe(2)
    })

    it('should handle string operations', () => {
        const result = 'hello' + ' ' + 'world'
        expect(result).toBe('hello world')
    })

    it('should work with arrays', () => {
        const arr = [1, 2, 3]
        expect(arr.length).toBe(3)
        expect(arr).toContain(2)
    })
})
