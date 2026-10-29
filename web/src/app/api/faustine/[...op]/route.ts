import { createFaustineHandler } from '@faustine-ai/next'
import registry from '@/faustine/registry'

export const { GET, POST } = createFaustineHandler(registry)
