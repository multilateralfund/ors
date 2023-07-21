import type { Metadata } from 'next'

import React from 'react'

import { Box, Button } from '@mui/material'
import Link from 'next/link'

import Portal from '@ors/components/manage/Utils/Portal'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Create report',
}

export default async function CreateReport() {
  return (
    <PageWrapper className="mx-4 mt-4">
      <Box className="mb-4 w-full rounded p-8 md:w-fit ">
        <h4 className="mb-4 font-bold">
          Create submission {new Date().getFullYear()}
        </h4>
        <p className="mb-4 text-gray-700  dark:text-gray-400">
          Create a submission
        </p>
        <Link href="/reports/create">
          <Button className="w-full" variant="contained">
            Create
          </Button>
        </Link>
      </Box>
      <Box className="mb-4 w-full rounded p-8 md:w-fit ">
        <h4 className="mb-4 font-bold">
          Create submission {new Date().getFullYear()}
        </h4>
        <p className="mb-4 text-gray-700  dark:text-gray-400">
          Create a submission
        </p>
        <Link href="/reports/create">
          <Button className="w-full" variant="contained">
            Create
          </Button>
        </Link>
      </Box>
      <Box className="mb-4 w-full rounded p-8 md:w-fit ">
        <h4 className="mb-4 font-bold">
          Create submission {new Date().getFullYear()}
        </h4>
        <p className="mb-4 text-gray-700  dark:text-gray-400">
          Create a submission
        </p>
        <Link href="/reports/create">
          <Button className="w-full" variant="contained">
            Create
          </Button>
        </Link>
      </Box>
      <Box className="mb-4 w-full rounded p-8 md:w-fit ">
        <h4 className="mb-4 font-bold">
          Create submission {new Date().getFullYear()}
        </h4>
        <p className="mb-4 text-gray-700  dark:text-gray-400">
          Create a submission
        </p>
        <Link href="/reports/create">
          <Button className="w-full" variant="contained">
            Create
          </Button>
        </Link>
      </Box>
      <Box className="mb-4 w-full rounded p-8 md:w-fit ">
        <h4 className="mb-4 font-bold">
          Create submission {new Date().getFullYear()}
        </h4>
        <p className="mb-4 text-gray-700  dark:text-gray-400">
          Create a submission
        </p>
        <Link href="/reports/create">
          <Button className="w-full" variant="contained">
            Create
          </Button>
        </Link>
      </Box>
      <Box className="mb-4 w-full rounded p-8 md:w-fit ">
        <h4 className="mb-4 font-bold">
          Create submission {new Date().getFullYear()}
        </h4>
        <p className="mb-4 text-gray-700  dark:text-gray-400">
          Create a submission
        </p>
        <Link href="/reports/create">
          <Button className="w-full" variant="contained">
            Create
          </Button>
        </Link>
      </Box>
      <Box className="mb-4 rounded p-8"></Box>
      <Portal domNode="bottom-control">
        <Box className="w-full justify-between border-0 border-t px-4">
          <Button color="error" size="small" variant="contained">
            Close
          </Button>
        </Box>
      </Portal>
    </PageWrapper>
  )
}
