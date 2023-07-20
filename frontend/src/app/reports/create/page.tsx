import Link from 'next/link'
import React from 'react'
import { IoMoon, IoSunny } from 'react-icons/io5'

import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Portal from '@ors/components/manage/Utils/Portal'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import type { Metadata } from 'next'
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
          <Button variant="contained" className="w-full">
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
          <Button variant="contained" className="w-full">
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
          <Button variant="contained" className="w-full">
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
          <Button variant="contained" className="w-full">
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
          <Button variant="contained" className="w-full">
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
          <Button variant="contained" className="w-full">
            Create
          </Button>
        </Link>
      </Box>
      <Box className="mb-4 rounded p-8"></Box>
      <Portal domNode="bottom-control">
        <Box className="w-full justify-between border-0 border-t px-4">
          <Button variant="contained" size="small" color="error">
            Close
          </Button>
        </Box>
      </Portal>
    </PageWrapper>
  )
}
