import type { CPCommentState } from '@ors/components/manage/Blocks/CountryProgramme/CPCommentsTypes.ts'
import type { CPReport } from '@ors/types/store'

const parseComments = (section: string, report: CPReport) => {
  const texts: CPCommentState = { country: '', mlfs: '' }

  if (report.data?.comments) {
    const commentsForSection = report.data.comments.filter(
      (comment) => comment.section === section,
    )
    texts.country =
      commentsForSection.find(
        (comment) => comment.comment_type === 'comment_country',
      )?.comment || ''
    texts.mlfs =
      commentsForSection.find(
        (comment) => comment.comment_type === 'comment_secretariat',
      )?.comment || ''
  }

  return texts
}

export default parseComments
