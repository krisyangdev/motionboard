export type GenerationInput = { prompt: string }

export type GenerationResult = { body: ArrayBuffer | string; contentType: string; ext: string }

export type GenerationContext = { jobId: string; userId: string }

export type GenerationProvider = {
  /** Credits one run costs; checked before the job is queued. Must be a positive integer. */
  cost(input: GenerationInput): number
  run(input: GenerationInput, ctx: GenerationContext): Promise<GenerationResult>
}
