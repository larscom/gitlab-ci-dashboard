import PipelineStatusTabs from './PipelineStatusTabs'
import ProjectFilter from './projects/ProjectFilter'

export default function PipelineOverview() {
  return (
    <>
      <ProjectFilter></ProjectFilter>
      <PipelineStatusTabs></PipelineStatusTabs>
    </>
  )
}
