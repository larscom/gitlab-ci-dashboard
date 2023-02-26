import { Branch } from './branch'
import { Pipeline } from './pipeline'

export interface BranchPipeline {
  branch: Branch
  pipeline?: Pipeline
}
