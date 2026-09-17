import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import Link from '@ors/components/ui/Link/Link'

import { map } from 'lodash'
import cx from 'classnames'

const LandingPage = () => {
  const {
    canViewCPReports,
    canViewReplenishment,
    canEditReplenishment,
    canViewBp,
    canViewProjects,
  } = useContext(PermissionsContext)

  const cards = [
    {
      title: 'Online CP reporting',
      href: '/country-programme/reports',
      description:
        'For National Ozone Officers only: record annual country programme data and track submissions.',
      permissions: canViewCPReports,
    },
    {
      title: 'Contributions',
      href: '/replenishment/dashboard/cummulative',
      description:
        'Securely manage invoices, payments and financial reports all in one place.',
      permissions: canViewReplenishment || canEditReplenishment,
    },
    {
      title: 'Business plans',
      href: '/business-plans',
      description: `See the projected activities and performance indicators agencies submit each year, consolidated into the Fund's Business Plan.`,
      permissions: canViewBp,
    },
    {
      title: 'Projects',
      href: '/projects-listing/listing',
      description:
        'Discover how Multilateral Fund projects are making a measurable impact in 144 countries. Access key data and performance metrics.',
      permissions: canViewProjects,
    },
  ]

  return (
    <div className="module-wrapper">
      {map(cards, (card) => (
        <div className="module-container">
          <Link
            href={card.permissions ? card.href : null}
            className={cx('flex w-full no-underline', {
              'is-link': card.permissions,
            })}
          >
            <div className="module-section">
              <div className="module-body">
                <div className="module-dots-wrapper">
                  <div className="module-dots" />
                </div>
                <div className="ml-5">
                  <h3 className="module-title">
                    {card.title}
                    <span className="title-arrow-wrapper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="51"
                        height="20"
                        fill="none"
                        preserveAspectRatio="none"
                        viewBox="0 0 51 20"
                        className="title-arrow"
                      >
                        <path
                          fill="currentColor"
                          d="M2 8.75a1.25 1.25 0 1 0 0 2.5zm47.884 2.134a1.25 1.25 0 0 0 0-1.768l-7.955-7.955A1.25 1.25 0 1 0 40.16 2.93L47.232 10l-7.07 7.071a1.25 1.25 0 1 0 1.767 1.768zM2 11.25h47v-2.5H2z"
                        ></path>
                      </svg>
                    </span>
                  </h3>
                  <div className="module-description">
                    <p>{card.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

export default LandingPage
