import { useState } from 'react'

import {
  Collapse,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { DebouncedFunc, debounce } from 'lodash'
import { Roboto_Condensed } from 'next/font/google'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import { matchPath } from '@ors/helpers/Url/Url'

import { IoChevronDown, IoChevronUp, IoClose, IoMenu } from 'react-icons/io5'

const robotoCondensed = Roboto_Condensed({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
})

const EXTERNAL_BASE_URL = 'https://prod.multilateralfund.edw.ro'
const makeExternalUrl = (path: string) => `${EXTERNAL_BASE_URL}${path}`

const makeInternalNavItem = (
  pathname: string,
  props: { label: string; url: string },
) => {
  return {
    current: !!matchPath(`${props.url}/*`, pathname || ''),
    internal: true,
    ...props,
  }
}

const useInternalNavSections = () => {
  const pathname = usePathname()
  const nI = makeInternalNavItem.bind(null, pathname)
  return [
    nI({ label: 'Country programmes', url: '/country-programme' }),
    nI({ label: 'Business plans', url: '/business-plans' }),
    nI({
      label: 'Project submissions',
      url: '/project-submissions',
    }),
    nI({ label: 'Projects', url: '/projects' }),
  ]
}

interface navItem {
  current: boolean
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
      makeExternalNavItem('Governance', '/about/governance'),
      makeExternalNavItem('History', '/about/history'),
      makeExternalNavItem('Mission', '/about/mission'),
      makeExternalNavItem(
        'Monitoring & Evaluation',
        '/about/monitoring-evaluation',
      ),
      makeExternalNavItem('Partners', '/about/partners'),
      makeExternalNavItem('Secretariat', '/about/secretariat'),
    ]),
    makeExternalNavItem('Our impact', '/our-impact'),
    makeExternalNavItem('Projects & Data', '/projects-data', [
      ...useInternalNavSections(),
      makeExternalNavItem(
        'Countries Dashboard',
        '/projects-data/countries-dashboard',
      ),
      makeExternalNavItem(
        'Funding Dashboard',
        '/projects-data/funding-dashboard',
      ),
      makeExternalNavItem(
        'People & Environment',
        '/projects-data/people-environment',
      ),
      makeExternalNavItem(
        'Projects Dashboard',
        '/projects-data/projects-dashboard',
      ),
    ]),
    makeExternalNavItem('Resources', '/resources', [
      makeExternalNavItem('Decision handbook', '/resources/decisions'),
      makeExternalNavItem(
        'Project Guides & Tools',
        '/resources/project-guides-tools',
      ),
      makeExternalNavItem('Scorecards', '/resources/secretariat-scorecards'),
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
  const [showMenu, setShowMenu] = useState<Record<string, boolean>>({})
  const [hideInProgress, setHideInProgress] = useState<
    Record<string, DebouncedFunc<any> | null>
  >({})

  const handleShowMenu = (label: string) => {
    hideInProgress[label]?.cancel?.()
    setShowMenu(() => ({ [label]: true }))
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
        'gap-x-4 text-nowrap rounded-full bg-white px-5 py-3 text-xl font-normal uppercase',
        robotoCondensed.className,
        className,
      )}
      onMouseLeave={handleHideAllMenus}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="relative flex cursor-pointer text-primary"
        >
          <a
            className={cx(
              'flex items-center justify-between gap-x-2 rounded-full px-4 py-2 text-primary no-underline hover:text-mlfs-hlYellow',
              {
                'bg-mlfs-hlYellow hover:text-primary': item.current,
                'hover:bg-primary': !item.current,
              },
            )}
            href={item.url}
            onMouseEnter={() => handleShowMenu(item.label)}
          >
            {item.label}
            {item.menu && <IoChevronDown />}
          </a>
          <AnimatePresence>
            {showMenu[item.label] && (
              <FadeInOut className="absolute left-0 z-10">
                <div
                  className="absolute top-16 z-10 flex flex-col rounded-lg bg-white shadow-xl"
                  onMouseLeave={handleHideAllMenus}
                  onMouseOver={() => handleShowMenu(item.label)}
                >
                  {item.menu?.map((menuItem) => {
                    const Component = menuItem?.internal ? NextLink : 'a'
                    return (
                      <Component
                        key={menuItem.label}
                        className={cx(
                          'border-2 border-l-0 border-r-0 border-t-0 border-solid border-b-sky-400 px-4 py-2 text-primary no-underline transition-all first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-mlfs-hlYellow',
                          { 'bg-mlfs-hlYellow': menuItem.current },
                        )}
                        href={menuItem.url}
                        {...(menuItem.external ? { target: '_blank' } : {})}
                      >
                        {menuItem.label}
                      </Component>
                    )
                  })}
                </div>
              </FadeInOut>
            )}
          </AnimatePresence>
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
  const initiallyExpanded = items
    .filter((item) => item.current)
    .reduce((acc, item) => ({ ...acc, [item.label]: true }), {})

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
    <div className={cx('text-primary', robotoCondensed.className, className)}>
      <IconButton
        className="mobile-header-navigation-button rounded-full"
        onClick={toggleDrawer(true)}
      >
        <IoMenu size={42} />
      </IconButton>
      <Drawer
        className={cx('radius-none', robotoCondensed.className)}
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
            const regularLink = !item.menu ? (
              <ListItem
                key={item.label}
                className={styling}
                slotProps={{ root: { href: item.url } as any }}
                slots={{ root: 'a' }}
              >
                {item.label}
              </ListItem>
            ) : null

            return (
              regularLink || (
                <>
                  <ListItemButton
                    key={item.label}
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
                        item.menu.map((menuItem) => (
                          <ListItem
                            key={menuItem.label}
                            className={cx(
                              'block py-4 pl-10 text-xl uppercase text-primary no-underline transition-all hover:bg-mlfs-hlYellowTint',
                              { 'bg-mlfs-hlYellowTint': menuItem.current },
                            )}
                            slotProps={{ root: { href: menuItem.url } as any }}
                            slots={{ root: 'a' }}
                          >
                            {menuItem.label}
                          </ListItem>
                        ))}
                    </List>
                  </Collapse>
                </>
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
