'use client'
import React, { createContext, useContext } from 'react'

import {
  StoreApi,
  useStore as useZustandStore,
  createStore as zustandCreateStore,
} from 'zustand'

import { CommonSlice, createCommonSlice } from '@ors/slices/createCommonSlice'

import {
  CPReportCreateSlice,
  createCPReportCreateSlice,
} from './slices/createCPReportCreateSlice'
import { createCacheSlice } from './slices/createCacheSlice'
import {
  ControlsSlice,
  createControlsSlice,
} from './slices/createControlsSlice'
import { HeaderSlice, createHeaderSlice } from './slices/createHeaderSlice'
import { I18nSlice, createI18nSlice } from './slices/createI18nSlice'
import { ProjectsSlice, createProjectSlice } from './slices/createProjectSlice'
import { ReportsSlice, createReportsSlice } from './slices/createReportsSlice'
import { ThemeSlice, createThemeSlice } from './slices/createThemeSlice'
import { UserSlice, createUserSlice } from './slices/createUserSlice'

export type StoreState = {
  cache: { [key: string]: any }
  common: CommonSlice
  connection: null | string
  controls: ControlsSlice
  cp_report_create: CPReportCreateSlice
  header: HeaderSlice
  i18n: I18nSlice
  projects: ProjectsSlice
  reports: ReportsSlice
  theme: ThemeSlice
  user: UserSlice
}

export type InitialStoreState = {
  cache?: { [key: string]: any }
  common?: CommonSlice
  connection?: null | string
  controls?: Partial<ControlsSlice>
  cp_report_create?: Partial<CPReportCreateSlice>
  header?: Partial<HeaderSlice>
  i18n?: Partial<I18nSlice>
  projects?: ProjectsSlice
  reports?: ReportsSlice
  theme?: Partial<ThemeSlice>
  user?: Partial<UserSlice>
}

let storeInstance: StoreApi<StoreState>

const createStore = (initialState?: InitialStoreState) => {
  storeInstance = zustandCreateStore<StoreState>((set, get) => {
    const args: [
      StoreApi<StoreState>['setState'],
      StoreApi<StoreState>['getState'],
      InitialStoreState | undefined,
    ] = [set, get, initialState]
    return {
      cache: { ...createCacheSlice(...args) },
      common: { ...createCommonSlice(...args) },
      connection: __CLIENT__
        ? // @ts-ignore
          navigator?.connection?.effectiveType || null
        : null,
      controls: { ...createControlsSlice(...args) },
      cp_report_create: { ...createCPReportCreateSlice(...args) },
      header: { ...createHeaderSlice(...args) },
      i18n: { ...createI18nSlice(...args) },
      projects: { ...createProjectSlice(...args) },
      reports: { ...createReportsSlice(...args) },
      theme: { ...createThemeSlice(...args) },
      user: { ...createUserSlice(...args) },
    }
  })

  return storeInstance
}

export const ZustandContext = createContext<StoreApi<StoreState>>(createStore())

export const Provider = ({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState: InitialStoreState
}) => {
  const [store] = React.useState(createStore(initialState))

  return (
    <ZustandContext.Provider value={store}>{children}</ZustandContext.Provider>
  )
}

export const getStore = () => storeInstance

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useStore(selector: (state: StoreState) => any) {
  return useZustandStore(useContext(ZustandContext), selector)
}
