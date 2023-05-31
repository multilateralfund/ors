import type { CustomFlowbiteTheme } from 'flowbite-react'

export const flowbiteTheme: CustomFlowbiteTheme = {
  badge: {
    icon: {
      off: 'rounded-full px-2 py-1',
    },
  },
  button: {
    color: {
      primary:
        'text-white bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800',
    },
    outline: {
      on: 'transition-all duration-75 ease-in group-hover:bg-opacity-0 group-hover:text-inherit',
    },
    size: {
      md: 'text-sm px-3 py-2',
    },
  },
  dropdown: {
    floating: {
      base: 'z-10 w-fit rounded-xl divide-y divide-gray-100 shadow',
      content: 'rounded-xl text-sm text-gray-700 dark:text-gray-200',
      target: 'w-fit dark:text-white',
    },
    content: '',
  },
  modal: {
    content: {
      inner: 'relative rounded-lg bg-white shadow dark:bg-gray-800',
    },
    header: {
      base: 'flex items-start justify-between rounded-t px-5 pt-5',
    },
  },
  navbar: {
    root: {
      base: 'fixed z-30 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700',
    },
  },
  sidebar: {
    root: {
      base: 'flex fixed top-0 left-0 z-20 flex-col flex-shrink-0 pt-16 h-full w-32 duration-75 border-r border-gray-200 lg:flex transition-width dark:border-gray-700',
    },
    item: {
      base: 'flex flex-col items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 hover:bg-gray-100 dark:bg-gray-700"',
    },
  },
  textarea: {
    base: 'block w-full text-sm p-4 rounded-lg border disabled:cursor-not-allowed disabled:opacity-50',
  },
  toggleSwitch: {
    toggle: {
      checked: {
        off: '!border-gray-200 !bg-gray-200 dark:!border-gray-600 dark:!bg-gray-700',
      },
    },
  },
  tab: {
    tablist: {
      tabitem: {
        base: 'focus:ring-0 focus:ring-offset-0 py-3 px-3',
      },
    },
    tabpanel: 'p-0',
  },
}
