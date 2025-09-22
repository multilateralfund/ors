import { useContext, useState, useEffect } from 'react'

import styles from './page.module.css'
import { useStore } from '@ors/store'
import { formatApiUrl } from '@ors/helpers/Api/utils'

import { Box } from '@mui/material'

import { MetaProjectType, ProjectType } from '@ors/types/api_projects.ts'
import useApi from '@ors/hooks/useApi'
import { getResults } from '@ors/helpers'

import PListingTable from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PListingTable'
import { detailItem } from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ViewHelperComponents'

import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

const useGetMetaProjects = (withCache: boolean = false) => {
  const { data, ...rest } = useApi<MetaProjectType[]>({
    options: {
      withStoreCache: withCache,
    },
    path: 'api/meta-projects-for-mya-update/',
  })
  const results = getResults(data)

  return { ...rest, ...results }
}

type MetaProjectFieldData = Record<
  string,
  { value: number | string | null; label: string; order: number }
>

type MetaProjectDetailType = {
  projects: ProjectType[]
  field_data: MetaProjectFieldData
} & MetaProjectType

const useGetMetaProjectDetails = (pk?: number) => {
  const [data, setData] = useState<MetaProjectDetailType | null>(null)

  const fetchData = (pk: number) => {
    fetch(formatApiUrl(`/api/meta-projects/${pk}`), { credentials: 'include' })
      .then((resp) => resp.json())
      .then((data) => setData(data))
  }

  useEffect(() => {
    if (pk) {
      fetchData(pk)
    }
  }, [pk])

  return { ...data }
}

const MetaProjectView = (props: { mp: MetaProjectDetailType }) => {
  const { mp } = props

  const fieldData = mp?.field_data ?? {}

  const orderedFieldData = []

  for (let key of Object.keys(fieldData)) {
    orderedFieldData.push({ name: key, ...fieldData[key] })
  }
  orderedFieldData.sort((a, b) => a.order - b.order)

  return (
    <div>
      {orderedFieldData.map((fd) => (
        <div key={fd.name}>
          {' '}
          {detailItem(fd.label, fd?.value?.toString() ?? '-')}{' '}
        </div>
      ))}
    </div>
  )
}

const COLUMNS = [
  { field: 'new_code', label: 'Code' },
  { field: 'type', label: 'Type' },
]

export default function ProjectsUpdateMyaDataPage() {
  usePageTitle('Projects - Update MYA data')

  const countries = useStore((state) => state.common.countries_for_listing.data)
  const countriesByIso3 = new Map<string, any>(
    countries.map((country: any) => [country.iso3, country]),
  )

  const [selected, setSelected] = useState<MetaProjectType | null>(null)

  const { canViewProjects } = useContext(PermissionsContext)

  const metaprojects = useGetMetaProjects()
  const metaproject = useGetMetaProjectDetails(selected?.id)
  const projects = getResults<ProjectType>(metaproject?.projects ?? [])

  const onToggleExpand = (mp: MetaProjectType) => {
    setSelected((prev) => {
      let newValue = null
      if (prev?.id !== mp.id) {
        newValue = mp
      }
      return newValue
    })
  }

  if (!canViewProjects) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">
        IA/BA Portal - Update MYA data
      </PageHeading>
      <Box className="shadow-none">
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.field}>{c.label}</th>
              ))}
              <th key={'country'}>Country</th>
            </tr>
          </thead>
          <tbody>
            {metaprojects.results.map((r) => [
              <tr key={r.id} onClick={() => onToggleExpand(r)}>
                {COLUMNS.map((c: any) => (
                  <td key={c.field}>{r[c.field as unknown as keyof typeof r]}</td>
                ))}
                <td>{countriesByIso3.get(r.new_code.split('/')[0])?.name}</td>
              </tr>,
              selected?.id === r.id ? (
                <tr key={`${r.id}-expanded`}>
                  <td colSpan={COLUMNS.length + 1}>
                    Expanded: {r.id}
                    <PListingTable
                      mode="listing"
                      projects={projects}
                      filters={{}}
                    />
                    <MetaProjectView mp={metaproject} />
                  </td>
                </tr>
              ) : null,
            ])}
          </tbody>
        </table>
      </Box>
    </PageWrapper>
  )
}
