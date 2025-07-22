import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ActivitiesFiltersSelectedOpts from './BPList/ActivitiesFiltersSelectedOpts'
import { multiYearFilterOptions, tableColumns } from './constants'
import { filterSubsectors } from './utils'
import useFocusOnCtrlF from '@ors/hooks/useFocusOnCtrlF'
import { debounce } from '@ors/helpers'

import { InputAdornment, IconButton as MuiIconButton } from '@mui/material'
import { IoChevronDown, IoSearchOutline } from 'react-icons/io5'
import { union } from 'lodash'

export default function ActivitiesFilters(props: any) {
  const {
    bpSlice,
    clusters,
    commonSlice,
    filters,
    form,
    handleFilterChange,
    handleParamsChange,
    initialFilters,
    withAgency = false,
  } = props

  const { canViewMetainfoProjects, canViewSectorsSubsectors } =
    useContext(PermissionsContext)

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
          onKeyDown={(event: any) => {
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
            commonSlice.countries.data,
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
              getFieldOptions(commonSlice.all_agencies.data, 'agency_id'),
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
                clusters,
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
                bpSlice.types.data,
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
                bpSlice.sectors.data,
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
                filterSubsectors(bpSlice.subsectors.data),
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
            multiYearFilterOptions,
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
      </div>
      <ActivitiesFiltersSelectedOpts
        {...{
          bpSlice,
          clusters,
          commonSlice,
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
