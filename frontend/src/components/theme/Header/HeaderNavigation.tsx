import { useContext, useState } from 'react'
import { useLocation } from 'wouter'
import Link from '@ors/components/ui/Link/Link'

import {
  Collapse,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material'
import cx from 'classnames'
import { DebouncedFunc, debounce } from 'lodash'

import { matchPath } from '@ors/helpers/Url/Url'
import { useStore } from '@ors/store'

import { IoChevronDown, IoChevronUp, IoClose, IoMenu } from 'react-icons/io5'
import PermissionsContext from '@ors/contexts/PermissionsContext'

const EXTERNAL_BASE_URL = 'https://www.multilateralfund.org'
const makeExternalUrl = (path: string) => `${EXTERNAL_BASE_URL}${path}`

interface MenuItem {
  current?: boolean
  label: string
  menu?: MenuItem[]
}

const makeInternalNavItem = (
  pathname: string,
  props: {
    label: string
    menu?: { label: string; url: string }[]
    url: string
  },
) => {
  const current = props.menu
    ? props.menu.some((menuItem) =>
        matchPath(`${menuItem.url}/*`, pathname || ''),
      )
    : matchPath(`${props.url}/*`, pathname || '') !== null

  const internal = true

  const processedMenu = props.menu?.map((menuItem) => ({
    ...menuItem,
    current: !!matchPath(`${menuItem.url}/*`, pathname || ''),
    internal,
  }))

  return {
    current,
    internal,
    ...props,
    menu: processedMenu,
  }
}

const useInternalNavSections = () => {
  const P = useContext(PermissionsContext)

  const [pathname] = useLocation()
  const nI = makeInternalNavItem.bind(null, pathname)

  return [
    {
      label: 'Online CP Reporting',
      menu: [
        P.canViewCPReports
          ? { label: 'View reports', url: '/country-programme/reports' }
          : null,
        P.canEditCPReports
          ? { label: 'Add new report', url: '/country-programme/create' }
          : null,
        P.canExportCPReports
          ? { label: 'Export data', url: '/country-programme/export-data' }
          : null,
        P.canExportCPReports
          ? { label: 'Settings', url: '/country-programme/settings' }
          : null,
      ].filter(Boolean),
      url: '/country-programme/reports',
    },
    ...(P.canViewBp
      ? [{ label: 'Business plans', url: '/business-plans' }]
      : []),
    ...(P.canViewV1Projects
      ? [{ label: 'Project submissions', url: '/project-submissions' }]
      : []),
    ...(P.canViewV1Projects ? [{ label: 'Projects', url: '/projects' }] : []),
    ...(P.canViewProjects || P.canSubmitProjects || P.canRecommendProjects
      ? [
          {
            label: 'Projects Listing',
            menu: [
              P.canViewProjects
                ? { label: 'View projects', url: '/projects-listing/listing' }
                : null,
              P.canSubmitProjects || P.canRecommendProjects
                ? {
                    label: 'IA/BA Portal - Settings',
                    url: '/projects-listing/settings',
                  }
                : null,
            ].filter(Boolean),
            url: '/projects-listing/listing',
          },
        ]
      : []),
    // @ts-ignore
  ].map((item) => nI(item))
}

const useInternalNavSectionsReplenishment = () => {
  const { canViewReplenishment } = useContext(PermissionsContext)
  const [pathname] = useLocation()
  const nI = makeInternalNavItem.bind(null, pathname)
  return canViewReplenishment
    ? [
        {
          label: 'Contributions',
          menu: [
            {
              label: 'Scale of assessment',
              url: '/replenishment/scale-of-assessment',
            },
            {
              label: 'Status of the fund',
              url: '/replenishment/status-of-the-fund',
            },
            { label: 'Statistics', url: '/replenishment/statistics' },
            {
              label: 'Status of contributions',
              url: '/replenishment/status-of-contributions',
            },
            { label: 'In/out flows', url: '/replenishment/in-out-flows' },
            { label: 'Dashboard', url: '/replenishment/dashboard' },
          ],
          url: '/replenishment',
        },
      ]
    : []
        // @ts-ignore
        .map((item) => nI(item))
}

interface navItem {
  current?: boolean
  external?: boolean
  internal?: boolean
  label: string
  menu?: navItem[]
  url: string
}

const makeExternalNavItem = (label: string, url: string, menu?: navItem[]) => {
  return {
    current: menu ? !!menu.filter((item) => item.current).length : false,
    external: true,
    label,
    menu,
    url: makeExternalUrl(url),
  }
}

const useMenuItems = () => {
  return [
    makeExternalNavItem('About MLF', '/about', [
      makeExternalNavItem('Mission', '/about/mission'),
      makeExternalNavItem('History', '/about/history'),
      makeExternalNavItem('Governance', '/about/governance'),
      makeExternalNavItem('Partners', '/about/partners'),
      makeExternalNavItem('Secretariat', '/about/secretariat'),
      makeExternalNavItem(
        'Monitoring & Evaluation',
        '/about/monitoring-evaluation',
      ),
      makeExternalNavItem(
        'Greening our operations',
        '/greening-our-operations',
      ),
    ]),
    makeExternalNavItem('Our impact', '/our-impact'),
    makeExternalNavItem('Projects & Data', '/projects-data', [
      makeExternalNavItem('Projects', '/projects-data/dashboards'),
      ...useInternalNavSectionsReplenishment(),
      makeExternalNavItem('Countries', '/projects-data/funding-dashboard'),
      makeExternalNavItem('Our impact', '/projects-data/people-environment'),
      makeExternalNavItem(
        'CP Data Center',
        '/projects-data/projects-dashboard',
      ),
      ...useInternalNavSections(),
    ]),
    makeExternalNavItem('Resources', '/resources', [
      makeExternalNavItem('Decisions', '/resources/decisions'),
      makeExternalNavItem(
        'Project Guides & Tools',
        '/resources/project-guides-tools',
      ),
      makeExternalNavItem('Scorecards', '/resources/secretariat-scorecards'),
      makeExternalNavItem('Factsheets', '/factsheets'),
      makeExternalNavItem('Newsletters', '/newsletters'),
      makeExternalNavItem('Policy frameworks', '/policy-frameworks'),
    ]),
    makeExternalNavItem('Meetings', '/meetings'),
    makeExternalNavItem('News & Stories', '/news-stories'),
  ]
}

const DesktopHeaderNavigation = ({
  className = '',
  items = [],
}: {
  className: string
  items: ReturnType<typeof useMenuItems>
}) => {
  const recursivelyExpandItems = (
    items: MenuItem[],
    acc: Record<string, boolean>,
  ) => {
    items.forEach((item) => {
      if (item.current) {
        acc[item.label] = true
      }
      if (item.menu) {
        recursivelyExpandItems(item.menu, acc)
      }
    })
  }

  const initiallyExpanded: Record<string, boolean> = {}
  recursivelyExpandItems(items, initiallyExpanded)

  const [showMenu, setShowMenu] = useState<Record<string, boolean>>({})
  const [hideInProgress, setHideInProgress] = useState<
    Record<string, DebouncedFunc<any> | null>
  >({})
  const [openMenus, setOpenMenus] =
    useState<Record<string, boolean>>(initiallyExpanded)
  const toggleCollapseOpen = (label: string) => {
    setOpenMenus((prev) => {
      const newState = { [label]: !prev[label] }

      Object.keys(prev).forEach((key) => {
        if (key !== label) {
          newState[key] = false
        }
      })

      return newState
    })
  }

  const handleShowMenu = (label: string) => {
    hideInProgress[label]?.cancel?.()
    setShowMenu(() => ({ [label]: true }))
  }

  const handleToggleMenu = (label: string) => {
    hideInProgress[label]?.cancel?.()
    const prev = showMenu[label]
    setShowMenu(() => ({ [label]: !prev }))
  }

  const handleHideAllMenus = () => {
    Object.keys(showMenu).forEach((key) => {
      const eta = debounce(
        () => setShowMenu((prev) => ({ ...prev, [key]: false })),
        300,
      )
      setHideInProgress((prev) => ({ ...prev, [key]: eta }))
      eta()
    })
  }

  return (
    <div
      id="header-navigation"
      className={cx(
        'relative gap-x-4 text-nowrap rounded-full bg-white px-5 py-3 text-xl font-normal uppercase print:hidden',
        className,
      )}
      onMouseLeave={handleHideAllMenus}
    >
      {items.map((item) => (
        <div key={item.label} className="relative" data-label={item.label}>
          <div className="flex cursor-pointer text-primary">
            <div
              className={cx(
                'flex items-center justify-between gap-x-2 rounded-full px-4 py-2 text-primary transition-all hover:text-mlfs-hlYellow',
                {
                  'bg-mlfs-hlYellow hover:text-primary': item.current,
                  'hover:bg-primary': !item.current,
                },
              )}
              onMouseEnter={() => handleShowMenu(item.label)}
            >
              <Link className="text-inherit no-underline" href={item.url}>
                {item.label}
              </Link>
              {item.menu && (
                <div onClick={() => handleToggleMenu(item.label)}>
                  <IoChevronDown />
                </div>
              )}
            </div>
          </div>
          <div
            className={cx(
              'absolute left-0 z-50 mt-4 origin-top opacity-0 transition-all',
              {
                'collapse scale-y-0': !showMenu[item.label],
                'scale-y-100 opacity-100': showMenu[item.label],
              },
            )}
          >
            <div
              className="z-10 flex flex-col rounded-lg bg-white shadow-xl"
              onMouseLeave={handleHideAllMenus}
              onMouseOver={() => handleShowMenu(item.label)}
            >
              {item.menu?.map((menuItem, menuItemIdx) => {
                const Component = menuItem?.internal ? Link : 'a'
                const regularSubMenuLink = !menuItem.menu ? (
                  <Component
                    key={menuItem.label + menuItemIdx}
                    className={cx(
                      'flex flex-nowrap items-center gap-1 text-nowrap border-2 border-l-0 border-r-0 border-t-0 border-solid border-b-sky-400 px-4 py-2 text-primary no-underline transition-all first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-mlfs-hlYellow',
                      {
                        'bg-mlfs-hlYellow': menuItem.current,
                      },
                    )}
                    href={menuItem.url}
                    onClick={() => toggleCollapseOpen(menuItem.label)}
                  >
                    {menuItem.label}
                  </Component>
                ) : null
                return (
                  regularSubMenuLink || (
                    <List
                      key={menuItem.label + menuItemIdx}
                      className="py-0"
                      component="div"
                    >
                      <ListItemButton
                        className={cx(
                          'flex flex-nowrap items-center gap-1 text-nowrap rounded-b-none border-2 border-l-0 border-r-0 border-t-0 border-solid border-b-sky-400 px-4 py-2 text-primary no-underline transition-all first:rounded-t-lg hover:bg-mlfs-hlYellow',
                          {
                            'bg-mlfs-hlYellow':
                              menuItem.current && !menuItem.menu,
                          },
                        )}
                        onClick={() => toggleCollapseOpen(menuItem.label)}
                      >
                        {menuItem.label}
                        {openMenus[menuItem.label] ? (
                          <IoChevronUp />
                        ) : (
                          <IoChevronDown />
                        )}
                      </ListItemButton>
                      <Collapse
                        in={openMenus[menuItem.label]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <List className="py-0" component="div">
                          {menuItem.menu &&
                            menuItem.menu.map((subMenuItem) => {
                              const Component = subMenuItem?.internal
                                ? Link
                                : 'a'
                              return (
                                <ListItem
                                  key={subMenuItem.label}
                                  className={cx(
                                    'last:rounded-0 text-nowrap border-2 border-l-0 border-r-0 border-t-0 border-solid border-b-sky-400 px-4 py-2 pl-8 text-lg text-primary no-underline transition-all hover:bg-mlfs-hlYellow',
                                    { 'bg-mlfs-hlYellow': subMenuItem.current },
                                  )}
                                  component={Component}
                                  href={subMenuItem.url}
                                >
                                  {subMenuItem.label}
                                </ListItem>
                              )
                            })}
                        </List>
                      </Collapse>
                    </List>
                  )
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const MobileHeaderNavigation = ({
  className = '',
  items = [],
}: {
  className: string
  items: ReturnType<typeof useMenuItems>
}) => {
  const initiallyExpanded: Record<string, boolean> = items.reduce(
    (acc, item) => {
      if (item.menu && item.menu.some((subItem) => subItem.current)) {
        acc[item.label] = true
      }
      if (item.menu) {
        item.menu.forEach((subItem) => {
          if (
            subItem.menu &&
            subItem.menu.some((subSubItem) => subSubItem.current)
          ) {
            acc[subItem.label] = true
          }
        })
      }
      return acc
    },
    {} as Record<string, boolean>,
  )

  const [open, setOpen] = useState(false)
  const [openMenus, setOpenMenus] =
    useState<Record<string, boolean>>(initiallyExpanded)

  const toggleOpenMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  return (
    <div className={cx('text-primary print:hidden', className)}>
      <IconButton
        className="mobile-header-navigation-button rounded-full"
        onClick={toggleDrawer(true)}
      >
        <IoMenu size={42} />
      </IconButton>
      <Drawer
        className={cx('radius-none')}
        anchor="right"
        open={open}
        onClose={toggleDrawer(false)}
      >
        <div className="flex justify-end">
          <IconButton
            className="mobile-header-navigation-button m-6 rounded-full"
            onClick={toggleDrawer(false)}
          >
            <IoClose size={42} />
          </IconButton>
        </div>
        <List className="min-w-96 px-4">
          {items.map((item) => {
            const styling =
              'block border-2 border-l-0 border-r-0 border-t-0 border-solid border-b-primary px-6 py-4 text-xl uppercase text-primary no-underline transition-all hover:bg-mlfs-hlYellowTint'
            const regularMenuLink = !item.menu ? (
              <ListItem
                key={item.label}
                className={styling}
                component={'a'}
                href={item.url}
              >
                {item.label}
              </ListItem>
            ) : null

            return (
              regularMenuLink || (
                <div key={item.label}>
                  <ListItemButton
                    className={cx(
                      'flex items-center justify-between rounded-none',
                      styling,
                    )}
                    onClick={() => toggleOpenMenu(item.label)}
                  >
                    {item.label}
                    {openMenus[item.label] ? (
                      <IoChevronUp />
                    ) : (
                      <IoChevronDown />
                    )}
                  </ListItemButton>
                  <Collapse
                    in={openMenus[item.label]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div">
                      {item.menu &&
                        item.menu.map((menuItem) => {
                          const regularSubMenuLink = !menuItem.menu ? (
                            <ListItem
                              key={menuItem.label}
                              className={cx(styling, 'pl-10')}
                              component={'a'}
                              href={menuItem.url}
                            >
                              {menuItem.label}
                            </ListItem>
                          ) : null

                          return (
                            regularSubMenuLink || (
                              <div key={menuItem.label}>
                                <ListItemButton
                                  className={cx(
                                    'flex items-center justify-between rounded-none',
                                    styling,
                                  )}
                                  onClick={() => toggleOpenMenu(menuItem.label)}
                                >
                                  {menuItem.label}
                                  {openMenus[menuItem.label] ? (
                                    <IoChevronUp />
                                  ) : (
                                    <IoChevronDown />
                                  )}
                                </ListItemButton>
                                <Collapse
                                  in={openMenus[menuItem.label]}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <List component="div">
                                    {menuItem.menu &&
                                      menuItem.menu.map((subMenuItem) => {
                                        const Component = subMenuItem?.internal
                                          ? Link
                                          : 'a'
                                        return (
                                          <ListItem
                                            key={subMenuItem.label}
                                            className={cx(
                                              'block py-4 pl-12 text-xl uppercase text-primary no-underline transition-all hover:bg-mlfs-hlYellowTint',
                                              {
                                                'bg-mlfs-hlYellowTint':
                                                  subMenuItem.current,
                                              },
                                            )}
                                            component={Component}
                                            href={subMenuItem.url}
                                          >
                                            {subMenuItem.label}
                                          </ListItem>
                                        )
                                      })}
                                  </List>
                                </Collapse>
                              </div>
                            )
                          )
                        })}
                    </List>
                  </Collapse>
                </div>
              )
            )
          })}
        </List>
      </Drawer>
    </div>
  )
}

const HeaderNavigation = () => {
  const items = useMenuItems()
  return (
    <>
      <DesktopHeaderNavigation className="hidden lg:flex" items={items} />
      <MobileHeaderNavigation className="lg:hidden" items={items} />
    </>
  )
}

export default HeaderNavigation
