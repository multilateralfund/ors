import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import BPDataContext from '@ors/contexts/BusinessPlans/BPDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ActivitiesFiltersSelectedOpts from './BPList/ActivitiesFiltersSelectedOpts'
import { multiYearFilterOptions, tableColumns } from './constants'
import { filterSubsectors } from './utils'
import useFocusOnCtrlF from '@ors/hooks/useFocusOnCtrlF'
import { debounce } from '@ors/helpers'

import { InputAdornment, IconButton as MuiIconButton } from '@mui/material'
import { IoChevronDown, IoSearchOutline } from 'react-icons/io5'
import { filter, map, union, uniq } from 'lodash'
import { CircularProgress } from '@mui/material'

export default function ActivitiesFilters(props: any) {
  const {
    bpSlice,
    clusters,
    filters,
    form,
    handleFilterChange,
    handleParamsChange,
    initialFilters,
    withAgency = false,
    allActivities,
  } = props

  const { canViewMetainfoProjects, canViewSectorsSubsectors } =
    useContext(PermissionsContext)
  const { agencies, countries } = useContext(BPDataContext)

  const searchRef = useFocusOnCtrlF()

  const defaultProps = {
    FieldProps: { className: 'mb-0 w-full md:w-[7.76rem] BPList' },
    popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
    componentsProps: {
      popupIndicator: {
        sx: {
          transform: 'none !important',
        },
      },
    },
  }

  const getFieldOptions = (data: any, field: string) => {
    const crtData = uniq(map(allActivities.results, field))
    return filter(data, (entry) => crtData.includes(entry.id))
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid h-full grid-cols-2 flex-wrap items-center gap-x-2 gap-y-2 border-0 border-solid md:flex">
        <Field
          name="search"
          defaultValue={filters.search}
          inputRef={searchRef}
          placeholder="Search in activities..."
          FieldProps={{
            className: 'mb-0 w-full md:w-[14.375rem] BPList',
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MuiIconButton
                  aria-label="search table"
                  edge="start"
                  tabIndex={-1}
                  onClick={() => {
                    const search = form.current.search.value
                    handleParamsChange({
                      offset: 0,
                      search,
                    })
                    handleFilterChange({ search })
                  }}
                  disableRipple
                >
                  <IoSearchOutline />
                </MuiIconButton>
              </InputAdornment>
            ),
          }}
          onKeyDown={(_: any) => {
            debounce(
              () => {
                const search = form.current.search.value
                handleParamsChange({
                  offset: 0,
                  search,
                })
                handleFilterChange({ search })
                if (searchRef.current) {
                  searchRef.current.select()
                }
              },
              1000,
              'BPFilterSearch',
            )
          }}
        />
        <Field
          Input={{ placeholder: tableColumns.country_id }}
          getOptionLabel={(option: any) => option?.name}
          options={getFilterOptions(
            filters,
            getFieldOptions(countries, 'country_id'),
            'country_id',
          )}
          value={[]}
          widget="autocomplete"
          onChange={(_: any, value: any) => {
            const country = filters.country_id || []
            const newValue = union(country, value)

            handleFilterChange({ country_id: newValue })
            handleParamsChange({
              country_id: newValue.map((item: any) => item.id).join(','),
              offset: 0,
            })
          }}
          multiple
          {...defaultProps}
        />
        {withAgency && (
          <Field
            Input={{ placeholder: tableColumns.agency_id }}
            getOptionLabel={(option: any) => option?.name}
            options={getFilterOptions(
              filters,
              getFieldOptions(agencies, 'agency_id'),
              'agency_id',
            )}
            value={[]}
            widget="autocomplete"
            onChange={(_: any, value: any) => {
              const agency = filters.agency_id || []
              const newValue = union(agency, value)

              handleFilterChange({ agency_id: newValue })
              handleParamsChange({
                agency_id: newValue.map((item: any) => item.id).join(','),
                offset: 0,
              })
            }}
            multiple
            {...defaultProps}
          />
        )}
        {canViewMetainfoProjects && (
          <>
            <Field
              Input={{ placeholder: tableColumns.project_cluster_id }}
              getOptionLabel={(option: any) => option?.name}
              options={getFilterOptions(
                filters,
                getFieldOptions(clusters, 'project_cluster_id'),
                'project_cluster_id',
              )}
              value={[]}
              widget="autocomplete"
              onChange={(_: any, value: any) => {
                const projectCluster = filters.project_cluster_id || []
                const newValue = union(projectCluster, value)

                handleFilterChange({ project_cluster_id: newValue })
                handleParamsChange({
                  offset: 0,
                  project_cluster_id: newValue
                    .map((item: any) => item.id)
                    .join(','),
                })
              }}
              multiple
              {...defaultProps}
            />
            <Field
              Input={{ placeholder: tableColumns.project_type_id }}
              getOptionLabel={(option: any) => option?.name}
              options={getFilterOptions(
                filters,
                getFieldOptions(bpSlice.types.data, 'project_type_id'),
                'project_type_id',
              )}
              value={[]}
              widget="autocomplete"
              isOptionEqualToValue={(option: any, value: any) =>
                option.id === value
              }
              onChange={(_: any, value: any) => {
                const projectType = filters.project_type_id || []
                const newValue = union(projectType, value)

                handleFilterChange({ project_type_id: newValue })
                handleParamsChange({
                  offset: 0,
                  project_type_id: newValue
                    .map((item: any) => item.id)
                    .join(','),
                })
              }}
              multiple
              {...defaultProps}
            />
          </>
        )}
        {canViewSectorsSubsectors && (
          <>
            <Field
              Input={{ placeholder: tableColumns.sector_id }}
              getOptionLabel={(option: any) => option?.name}
              options={getFilterOptions(
                filters,
                getFieldOptions(bpSlice.sectors.data, 'sector_id'),
                'sector_id',
              )}
              value={[]}
              widget="autocomplete"
              onChange={(_: any, value: any) => {
                const sector = filters.sector_id || []
                const newValue = union(sector, value)

                handleFilterChange({ sector_id: newValue })
                handleParamsChange({
                  offset: 0,
                  sector_id: newValue.map((item: any) => item.id).join(','),
                })
              }}
              multiple
              {...defaultProps}
            />
            <Field
              Input={{ placeholder: tableColumns.subsector_id }}
              getOptionLabel={(option: any) => option?.name}
              options={getFilterOptions(
                filters,
                getFieldOptions(
                  filterSubsectors(bpSlice.subsectors.data),
                  'subsector_id',
                ),
                'subsector_id',
              )}
              value={[]}
              widget="autocomplete"
              onChange={(_: any, value: any) => {
                const subsector = filters.subsector_id || []
                const newValue = union(subsector, value)

                handleFilterChange({ subsector_id: newValue })
                handleParamsChange({
                  offset: 0,
                  subsector_id: newValue.map((item: any) => item.id).join(','),
                })
              }}
              multiple
              {...defaultProps}
            />
          </>
        )}
        <Field
          Input={{ placeholder: 'I/M' }}
          getOptionLabel={(option: any) => option?.name}
          options={getFilterOptions(
            filters,
            getFieldOptions(multiYearFilterOptions, 'is_multi_year'),
            'is_multi_year',
          )}
          value={[]}
          widget="autocomplete"
          isOptionEqualToValue={(option: any, value: any) =>
            option.id === value
          }
          onChange={(_: any, value: any) => {
            const isMultiYear = filters.is_multi_year || []
            const newValue = union(isMultiYear, value)

            handleFilterChange({
              is_multi_year: newValue,
            })
            handleParamsChange({
              is_multi_year: newValue.map((item: any) => item.id).join(','),
              offset: 0,
            })
          }}
          multiple
          {...defaultProps}
        />
        {!allActivities.loaded && (
          <CircularProgress color="inherit" size="20px" className="ml-1.5" />
        )}
      </div>
      <ActivitiesFiltersSelectedOpts
        {...{
          bpSlice,
          clusters,
          filters,
          form,
          handleFilterChange,
          handleParamsChange,
          initialFilters,
          withAgency,
        }}
      />
    </div>
  )
}
