import { useRef, useState } from 'react'
import TruncateMarkup from 'react-truncate-markup'

import { Popover, Tooltip, Typography } from '@mui/material'

import { truncateText } from '@ors/components/manage/Utils/diffUtils'

const Comment = ({ comment }: { comment: string }) => {
  return (
    <Tooltip
      TransitionProps={{ timeout: 0 }}
      title={comment}
      classes={{
        tooltip: 'bp-table-tooltip',
      }}
    >
      <Typography
        className="inline-flex cursor-default items-center gap-2 rounded bg-gray-100 px-1 text-xs font-normal text-gray-A700"
        component="p"
        variant="h6"
      >
        {truncateText(comment, 30)}
      </Typography>
    </Tooltip>
  )
}

const CommentsTagList = ({ comments = [] }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const extraTagsIndicatorRef = useRef(null)

  const handleExtraTagsListOpen = () => {
    setAnchorEl(extraTagsIndicatorRef.current)
  }

  const handleExtraTagsListClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'extra-tags-popover' : undefined

  const commentsLeftEllipsis = (node: any) => {
    const displayedComments = node.props.children

    return (
      <div>
        <span aria-describedby={id} onMouseOver={handleExtraTagsListOpen}>
          ...
        </span>
        <Popover
          id={id}
          TransitionProps={{ timeout: 0 }}
          anchorEl={anchorEl}
          open={open}
          anchorOrigin={{
            horizontal: 'center',
            vertical: 'bottom',
          }}
          slotProps={{
            paper: {
              className:
                'overflow-visible mt-2 rounded-lg border-1 border-solid border-primary bg-white shadow-xl',
              onMouseLeave: handleExtraTagsListClose,
            },
          }}
          transformOrigin={{
            horizontal: 'right',
            vertical: 'top',
          }}
          onClose={handleExtraTagsListClose}
          disableAutoFocus
          disableScrollLock
        >
          <div className="flex max-h-64 max-w-72 flex-wrap gap-1 overflow-y-auto p-4">
            {comments
              .slice(displayedComments.length, comments.length)
              .map((comment: string, index: number) => (
                <Comment {...{ comment }} key={`remaining-comment-${index}`} />
              ))}
          </div>
        </Popover>
      </div>
    )
  }

  return (
    <div className="flex flex-row">
      <TruncateMarkup ellipsis={commentsLeftEllipsis} lineHeight="16px">
        <div className="!flex flex-wrap gap-0.5">
          {comments.map((comment: string, index: number) => (
            <TruncateMarkup.Atom key={`atom-${index}`}>
              <Comment {...{ comment }} />
            </TruncateMarkup.Atom>
          ))}
        </div>
      </TruncateMarkup>
      <div ref={extraTagsIndicatorRef} />
    </div>
  )
}

export default CommentsTagList