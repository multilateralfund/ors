import { CommentData } from '@ors/types/store'
import { UserType, userCanCommentCountry, userCanCommentSecretariat } from '@ors/types/user_types'

import React, { useEffect, useState } from 'react'

import { Alert } from '@mui/material'
import Button from '@mui/material/Button'
import TextareaAutosize from '@mui/material/TextareaAutosize'
import Typography from '@mui/material/Typography'

import SectionOverlay from '@ors/components/ui/SectionOverlay/SectionOverlay'
import api from '@ors/helpers/Api/_api'
import { useStore } from '@ors/store'

interface TextState {
  country: string
  mlfs: string
}

type Label = keyof TextState

const CPComments: React.FC = (props: any) => {
  const { form, section, viewOnly } = props
  const user = useStore((state) => state.user)
  const user_type: UserType = user.data.user_type
  const { cacheInvalidateReport, report, setReport } = useStore(
    (state) => state.cp_reports,
  )
  const [initialTexts, setInitialTexts] = useState<TextState>({
    country: '',
    mlfs: '',
  })
  const [error, setError] = useState(null)
  const [texts, setTexts] = useState<TextState>(initialTexts)
  const [latestVersion, setLatestVersion] = useState(false)

  useEffect(() => {
    if (report.data) {
      const isLatestVersion = !report.data.final_version_id
      setLatestVersion(isLatestVersion)
    }
  }, [report])

  useEffect(() => {
    if (report?.data?.comments) {
      const commentsForSection = report.data.comments.filter(
        (comment) => comment.section === section,
      )
      const texts: TextState = {
        country:
          commentsForSection.find(
            (comment) => comment.comment_type === 'comment_country',
          )?.comment || '',
        mlfs:
          commentsForSection.find(
            (comment) => comment.comment_type === 'comment_secretariat',
          )?.comment || '',
      }
      setInitialTexts(texts)
      setTexts(texts)
    }
  }, [section, report])

  const handleTextChange = (label: Label, value: string) => {
    setTexts((prevTexts) => ({
      ...prevTexts,
      [label]: value,
    }))
  }

  const handleSave = async (userType: Label) => {
    try {
      const comments = {
        country: texts['country'] || '',
        secretariat: texts['mlfs'] || '',
      }

      const data: CommentData = {
        comment:
          userCanCommentCountry[userType as UserType] ? comments.country : comments.secretariat,
        comment_type:
          userCanCommentCountry[userType as UserType] ? 'comment_country' : 'comment_secretariat',
        section: section,
      }

      const report_id = report.data?.id
      await api(`api/country-programme/report/${report_id}/comments/`, {
        data: data,
        method: 'POST',
      })

      const filteredComments = (report.data?.comments || []).filter(
        (comment) =>
          !(
            comment.section === section &&
            comment.comment_type === data.comment_type
          ),
      )

      const updatedComments = [...filteredComments, data]

      setInitialTexts(texts)
      setReport({
        // @ts-ignore
        data: {
          ...report.data,
          comments: updatedComments,
        },
      })
      // @ts-ignore
      cacheInvalidateReport(report.data?.country_id, report.data?.year)
      setError(null)
    } catch (error) {
      console.error('Error:', error)
      setError(error)
    }
  }

  const handleCancel = (label: Label) => {
    setError(null)
    setTexts((prevTexts) => ({
      ...prevTexts,
      [label]: initialTexts[label],
    }))
  }

  const orderedUsers: Label[] = ['country', 'mlfs']

  const commentsMeta = {
    country: {
      label: 'Country',
      user_check: userCanCommentCountry,
    },
    mlfs: {
      label: 'MLFS',
      user_check: userCanCommentSecretariat,
    },
  }

  const emptyComments = (userType: Label) => {
    return texts[userType] === '' && initialTexts[userType] === ''
  }


  return (
    <div className="-mx-6 -mb-6 mt-6 flex w-auto flex-wrap justify-around gap-6 rounded-b-lg bg-gray-100 px-6 pb-6">
      {orderedUsers.map((user) => {
        const canEditComment =
          commentsMeta[user].user_check[user_type as UserType] &&
          latestVersion &&
          viewOnly === false &&
          report.data?.status !== 'draft'
        const disabledBtn = texts[user] === initialTexts[user]
        return (
          <div
            key={user}
            className="relative flex min-w-[500px] flex-col rounded-lg rounded-b-lg bg-gray-100"
          >
            {!canEditComment && (
              <SectionOverlay
                className="cursor-not-allowed"
                opacity="opacity-30"
              />
            )}
            <label className="py-4 text-2xl font-medium">
              Comment {commentsMeta[user].label}
            </label>
            <div className="CPComments relative">
              <TextareaAutosize
                className="w-full resize-none rounded-lg border border-transparent bg-white p-2 pb-10 shadow-none"
                minRows={3}
                placeholder={canEditComment ? 'Type your comment here...' : ''}
                tabIndex={-1}
                value={texts[user]}
                onChange={(e) => handleTextChange(user, e.target.value)}
              />
              {canEditComment && !emptyComments(user) && (
                <div className="absolute bottom-2 right-2 mb-2 flex gap-2">
                  <Button
                    color="secondary"
                    disabled={disabledBtn}
                    size="small"
                    variant="contained"
                    onClick={() => handleSave(user)}
                  >
                    Save
                  </Button>
                  <Button
                    color={disabledBtn ? 'secondary' : undefined}
                    disabled={disabledBtn}
                    size="small"
                    variant="contained"
                    onClick={() => handleCancel(user)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            {error && commentsMeta[user].user_check[user_type as UserType] && (
              <Alert severity="error">
                <Typography>Something went wrong. Please try again.</Typography>
              </Alert>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default CPComments
