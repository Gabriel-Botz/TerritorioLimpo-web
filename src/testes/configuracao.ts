import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'
import type { AxeMatchers } from 'vitest-axe/dist/matchers'
import { toHaveNoViolations } from 'vitest-axe/dist/matchers'

expect.extend({ toHaveNoViolations } as unknown as Parameters<typeof expect.extend>[0])

// Tipagem do matcher de acessibilidade (vitest-axe).
declare module 'vitest' {
  // Augmentação do matcher do vitest-axe (parâmetros idênticos ao do Vitest).
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Assertion<R extends void | Promise<void> = void, T = unknown> extends AxeMatchers {}
}

afterEach(() => {
  cleanup()
})
