import type { Enums } from './database'

export type JobType = Enums<'job_type'>
export type JobStatus = Enums<'job_status'>

/** Job como o front acompanha: sem quem pediu, sem o erro técnico e sem o consumo da IA. */
export interface GenerationJob {
  id: string
  type: JobType
  status: JobStatus
}
