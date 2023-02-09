import { Branch } from './branch'
import { Pipeline } from './pipeline'

export interface BranchWithLatestPipeline {
  branch: Branch
  pipeline?: Pipeline
}
