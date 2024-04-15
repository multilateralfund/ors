import { UserType } from '@ors/types/user_types'

import React, { useState } from 'react'

import { Alert } from '@mui/material'
import Button from '@mui/material/Button'
import TextareaAutosize from '@mui/material/TextareaAutosize'
import Typography from '@mui/material/Typography'

import SectionOverlay from '@ors/components/ui/SectionOverlay/SectionOverlay'
import api from '@ors/helpers/Api/Api'
import { useStore } from '@ors/store'

interface TextState {
  country: string
  mlfs: string
}

type Label = keyof TextState

const CPComments: React.FC = () => {
  const user = useStore((state) => state.user)
  const user_type: UserType = user.data.user_type
  const { report } = useStore((state) => state.cp_reports)
  // GET initial texts from API
  const [initialTexts, setInitialTexts] = useState<TextState>({
    country: report.data?.comment_country || '',
    mlfs: report.data?.comment_secretariat || '',
  })
  const [error, setError] = useState(null)
  const [texts, setTexts] = useState<TextState>(initialTexts)

  const handleTextChange = (label: Label, value: string) => {
    setTexts((prevTexts) => ({
      ...prevTexts,
      [label]: value,
    }))
  }

  const handleSave = async (userType: Label) => {
    try {
      const comments = {
        comment_country: texts['country'] || '',
        comment_secretariat: texts['mlfs'] || '',
      }

      const data =
        userType === 'country'
          ? { comment_country: comments.comment_country }
          : { comment_secretariat: comments.comment_secretariat }

      const report_id = report.data?.id
      await api(`api/country-programme/report/${report_id}/comments/`, {
        data: data,
        method: 'POST',
      })

      // Update initialTexts with the current texts state
      setInitialTexts(texts)
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
      user_type: 'country_user',
    },
    mlfs: {
      label: 'MLFS',
      user_type: 'secretariat',
    },
  }

  const emptyComments = (userType: Label) => {
    return texts[userType] === '' && initialTexts[userType] === ''
  }

  return (
    <form className="mt-4 flex w-full flex-col gap-4">
      <Typography className="flex-1" component="h2" variant="h6">
        Comments
      </Typography>
      <div className="flex w-full flex-1 flex-wrap gap-4">
        {orderedUsers.map((user) => (
          <div
            key={user}
            className="relative flex min-w-96 flex-1 flex-col rounded-lg bg-gray-100 p-2"
          >
            {user_type !== commentsMeta[user].user_type && (
              <SectionOverlay
                className="cursor-not-allowed"
                opacity="opacity-60"
              />
            )}
            <label className="py-2 text-2xl font-normal">
              {commentsMeta[user].label}
            </label>
            <div className="CPComments relative">
              <TextareaAutosize
                className="w-full resize-none rounded-lg border border-solid border-gray-300 p-2 pb-10 shadow-none"
                minRows={6}
                placeholder="Type your comment here..."
                value={texts[user]}
                onChange={(e) => handleTextChange(user, e.target.value)}
              />
              {user_type === commentsMeta[user].user_type &&
                !emptyComments(user) && (
                  <div className="absolute bottom-2 right-2 mb-2 flex gap-2 opacity-60">
                    <Button
                      color="primary"
                      disabled={texts[user] === initialTexts[user]}
                      size="small"
                      variant="contained"
                      onClick={() => handleSave(user)}
                    >
                      Save
                    </Button>
                    <Button
                      disabled={texts[user] === initialTexts[user]}
                      size="small"
                      variant="outlined"
                      onClick={() => handleCancel(user)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
            </div>
            {error && user_type === commentsMeta[user].user_type && (
              <Alert severity="error">
                <Typography>Something went wrong. Please try again.</Typography>
              </Alert>
            )}
          </div>
        ))}
      </div>
    </form>
  )
}

export default CPComments
