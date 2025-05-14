// === ANIMATION FUNCTIONS ===

import { Clock, Group } from 'three'

export function playIdleAnimation(clock: Clock, ref: Group) {
    const speed = 5
    const wobbleAmount = 0.08
    const wobble = Math.sin(clock.getElapsedTime() * speed * 1.5) * wobbleAmount
    ref.rotation.y = wobble
    ref.rotation.z = wobble
}

export function playHoverAnimation(clock: Clock, ref: Group) {
    const floatSpeed = 12
    const floatHeight = 0.1
    const yOffset = Math.sin(clock.getElapsedTime() * floatSpeed) * floatHeight
    ref.position.y = yOffset
}

export function playWalkAnimation(clock: Clock, ref: Group) {
    const swaySpeed = 16
    const swayAmount = 0.05
    const sway = Math.sin(clock.getElapsedTime() * swaySpeed) * swayAmount
    ref.rotation.z = sway
    ref.position.x = sway
}

export function playSpinAnimation(clock: Clock, ref: Group) {
    const spinSpeed = 4 // radians per second
    ref.rotation.y = clock.getElapsedTime() * spinSpeed
}

export function playBounceAnimation(clock: Clock, ref: Group) {
    const bounceSpeed = 3
    const bounceHeight = 0.2
    const bounce =
        Math.abs(Math.sin(clock.getElapsedTime() * bounceSpeed)) * bounceHeight
    ref.position.y = bounce
}

// === COMBINE ANIMATIONS ===

export function combineAnimations(
    ...animations: ((clock: Clock, ref: Group) => void)[]
): (clock: Clock, ref: Group) => void {
    return (clock, ref) => {
        animations.forEach((anim) => anim(clock, ref))
    }
}
