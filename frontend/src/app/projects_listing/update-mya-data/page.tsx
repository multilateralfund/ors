import { useContext, useState, useEffect, useCallback } from 'react'

import styles from './page.module.css'
import { useStore } from '@ors/store'
import { formatApiUrl } from '@ors/helpers/Api/utils'
import { api } from '@ors/helpers'

import { Box } from '@mui/material'
import { Tabs, Tab } from '@mui/material'
import { Button, Divider } from '@mui/material'

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

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { DateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'

import dayjs from 'dayjs'

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

  const refresh = useCallback(() => {
    if (pk) {
      fetchData(pk)
    }
  }, [pk])

  useEffect(() => {
    if (pk) {
      fetchData(pk)
    }
  }, [pk])

  return { data, refresh }
}

const orderFieldData = (fd: MetaProjectFieldData) => {
  const orderedFieldData = []

  for (let key of Object.keys(fd)) {
    orderedFieldData.push({ name: key, ...fd[key] })
  }
  orderedFieldData.sort((a, b) => a.order - b.order)

  return orderedFieldData
}

const MetaProjectView = (props: { mp: MetaProjectDetailType }) => {
  const { mp } = props

  const fieldData = orderFieldData(mp?.field_data ?? {})

  return (
    <div>
      {fieldData.map((fd) => (
        <div key={fd.name}>
          {detailItem(fd.label, fd?.value?.toString() ?? '-')}
        </div>
      ))}
    </div>
  )
}

const MetaProjectEdit = (props: {
  mp: MetaProjectDetailType
  refreshMetaProjectDetails: () => void
}) => {
  const { mp, refreshMetaProjectDetails } = props

  const loadInitialState = useCallback(() => {
    const result = {} as Record<string, any>
    const fd = mp?.field_data ?? ({} as MetaProjectFieldData)

    for (let key of Object.keys(fd)) {
      result[key] = fd[key as keyof MetaProjectFieldData].value
    }

    return result
  }, [mp])

  const [form, setForm] = useState(loadInitialState)

  useEffect(() => {
    setForm(loadInitialState)
  }, [mp])

  const fieldData = orderFieldData(mp?.field_data ?? {})

  const handleSave = async () => {
    const result = await api(`api/meta-projects/${mp.id}/`, {
      data: form,
      method: 'PUT',
    })
    refreshMetaProjectDetails()
  }

  const changeSimpleInput = useCallback(
    (name: string, opts?: { numeric?: boolean }) => {
      return (evt: any) => {
        setForm((prev) => {
          let newValue = evt.target.value || null
          if (opts?.numeric && isNaN(Number(newValue))) {
            newValue = prev[name]
          }
          return { ...prev, [name]: newValue }
        })
      }
    },
    [setForm],
  )

  const renderFieldData = (fieldData: any) => {
    return fieldData.map((fd: any) => (
      <div key={fd.name}>
        <Label htmlFor={fd.name}>{fd.label}</Label>
        {fd.type === 'DateTimeField' ? (
          <DateInput
            id={fd.name}
            className="BPListUpload !ml-0 h-10 w-40"
            value={form[fd.name] ?? ''}
            formatValue={(value) => dayjs(value).format('MM/DD/YYYY')}
            onChange={changeSimpleInput(fd.name)}
          />
        ) : null}
        {fd.type !== 'DateTimeField' ? (
          <SimpleInput
            id={fd.name}
            label=""
            type="text"
            value={form[fd.name] ?? ''}
            onChange={changeSimpleInput(fd.name, {
              numeric: fd.type === 'DecimalField',
            })}
          />
        ) : null}
      </div>
    ))
  }

  return (
    <div>
      <div>{renderFieldData(fieldData)}</div>
      <Divider className="my-4" />
      <div>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}

const MetaProjectTabs = (props: any) => {
  const { mp, refreshMetaProjectDetails } = props
  const [mode, setMode] = useState('view')

  return (
    <>
      <Tabs
        value={mode}
        onChange={(_evt, value) => {
          setMode(value)
        }}
      >
        <Tab value={'view'} label="View" />
        <Tab value={'edit'} label="Edit" />
      </Tabs>
      {mode === 'edit' ? (
        <MetaProjectEdit
          mp={mp}
          refreshMetaProjectDetails={refreshMetaProjectDetails}
        />
      ) : (
        <MetaProjectView mp={mp} />
      )}
    </>
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
  const { data: metaproject, refresh: refreshMetaProjectDetails } =
    useGetMetaProjectDetails(selected?.id)
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
                  <td key={c.field}>
                    {r[c.field as unknown as keyof typeof r]}
                  </td>
                ))}
                <td>{countriesByIso3.get(r.new_code.split('/')[0])?.name}</td>
              </tr>,
              selected?.id === r.id ? (
                <tr key={`${r.id}-expanded`}>
                  <td colSpan={COLUMNS.length + 1}>
                    <Box>
                      <PListingTable
                        mode="listing"
                        projects={projects as any}
                        filters={{}}
                      />
                      {metaproject?.field_data ? (
                        <MetaProjectTabs
                          mp={metaproject}
                          refreshMetaProjectDetails={refreshMetaProjectDetails}
                        />
                      ) : null}
                    </Box>
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
