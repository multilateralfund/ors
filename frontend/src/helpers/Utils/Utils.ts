import { GridApi, RowDataTransaction } from 'ag-grid-community'
import {
  get,
  isArray,
  isFunction,
  isNaN,
  isNull,
  isNumber,
  isObject,
  isString,
} from 'lodash'

const timer: Record<string, any> = {}

const countryISOMapping: { [key: string]: string } = {
  ABW: 'AW',
  AFG: 'AF',
  AGO: 'AO',
  AIA: 'AI',
  ALA: 'AX',
  ALB: 'AL',
  AND: 'AD',
  ANT: 'AN',
  ARE: 'AE',
  ARG: 'AR',
  ARM: 'AM',
  ASM: 'AS',
  ATA: 'AQ',
  ATF: 'TF',
  ATG: 'AG',
  AUS: 'AU',
  AUT: 'AT',
  AZE: 'AZ',
  BDI: 'BI',
  BEL: 'BE',
  BEN: 'BJ',
  BES: 'BQ',
  BFA: 'BF',
  BGD: 'BD',
  BGR: 'BG',
  BHR: 'BH',
  BHS: 'BS',
  BIH: 'BA',
  BLM: 'BL',
  BLR: 'BY',
  BLZ: 'BZ',
  BMU: 'BM',
  BOL: 'BO',
  BRA: 'BR',
  BRB: 'BB',
  BRN: 'BN',
  BTN: 'BT',
  BVT: 'BV',
  BWA: 'BW',
  CAF: 'CF',
  CAN: 'CA',
  CCK: 'CC',
  CHE: 'CH',
  CHL: 'CL',
  CHN: 'CN',
  CIV: 'CI',
  CMR: 'CM',
  COD: 'CD',
  COG: 'CG',
  COK: 'CK',
  COL: 'CO',
  COM: 'KM',
  CPV: 'CV',
  CRI: 'CR',
  CUB: 'CU',
  CUW: 'CW',
  CXR: 'CX',
  CYM: 'KY',
  CYP: 'CY',
  CZE: 'CZ',
  DEU: 'DE',
  DJI: 'DJ',
  DMA: 'DM',
  DNK: 'DK',
  DOM: 'DO',
  DZA: 'DZ',
  ECU: 'EC',
  EGY: 'EG',
  ERI: 'ER',
  ESH: 'EH',
  ESP: 'ES',
  EST: 'EE',
  ETH: 'ET',
  FIN: 'FI',
  FJI: 'FJ',
  FLK: 'FK',
  FRA: 'FR',
  FRO: 'FO',
  FSM: 'FM',
  GAB: 'GA',
  GBR: 'GB',
  GEO: 'GE',
  GGY: 'GG',
  GHA: 'GH',
  GIB: 'GI',
  GIN: 'GN',
  GLP: 'GP',
  GMB: 'GM',
  GNB: 'GW',
  GNQ: 'GQ',
  GRC: 'GR',
  GRD: 'GD',
  GRL: 'GL',
  GTM: 'GT',
  GUF: 'GF',
  GUM: 'GU',
  GUY: 'GY',
  HKG: 'HK',
  HMD: 'HM',
  HND: 'HN',
  HRV: 'HR',
  HTI: 'HT',
  HUN: 'HU',
  IDN: 'ID',
  IMN: 'IM',
  IND: 'IN',
  IOT: 'IO',
  IRL: 'IE',
  IRN: 'IR',
  IRQ: 'IQ',
  ISL: 'IS',
  ISR: 'IL',
  ITA: 'IT',
  JAM: 'JM',
  JEY: 'JE',
  JOR: 'JO',
  JPN: 'JP',
  KAZ: 'KZ',
  KEN: 'KE',
  KGZ: 'KG',
  KHM: 'KH',
  KIR: 'KI',
  KNA: 'KN',
  KOR: 'KR',
  KWT: 'KW',
  LAO: 'LA',
  LBN: 'LB',
  LBR: 'LR',
  LBY: 'LY',
  LCA: 'LC',
  LIE: 'LI',
  LKA: 'LK',
  LSO: 'LS',
  LTU: 'LT',
  LUX: 'LU',
  LVA: 'LV',
  MAC: 'MO',
  MAF: 'MF',
  MAR: 'MA',
  MCO: 'MC',
  MDA: 'MD',
  MDG: 'MG',
  MDV: 'MV',
  MEX: 'MX',
  MHL: 'MH',
  MKD: 'MK',
  MLI: 'ML',
  MLT: 'MT',
  MMR: 'MM',
  MNE: 'ME',
  MNG: 'MN',
  MNP: 'MP',
  MOZ: 'MZ',
  MRT: 'MR',
  MSR: 'MS',
  MTQ: 'MQ',
  MUS: 'MU',
  MWI: 'MW',
  MYS: 'MY',
  MYT: 'YT',
  NAM: 'NA',
  NCL: 'NC',
  NER: 'NE',
  NFK: 'NF',
  NGA: 'NG',
  NIC: 'NI',
  NIU: 'NU',
  NLD: 'NL',
  NOR: 'NO',
  NPL: 'NP',
  NRU: 'NR',
  NZL: 'NZ',
  OMN: 'OM',
  PAK: 'PK',
  PAN: 'PA',
  PCN: 'PN',
  PER: 'PE',
  PHL: 'PH',
  PLW: 'PW',
  PNG: 'PG',
  POL: 'PL',
  PRI: 'PR',
  PRK: 'KP',
  PRT: 'PT',
  PRY: 'PY',
  PSE: 'PS',
  PYF: 'PF',
  QAT: 'QA',
  REU: 'RE',
  ROU: 'RO',
  RUS: 'RU',
  RWA: 'RW',
  SAU: 'SA',
  SDN: 'SD',
  SEN: 'SN',
  SGP: 'SG',
  SGS: 'GS',
  SHN: 'SH',
  SJM: 'SJ',
  SLB: 'SB',
  SLE: 'SL',
  SLV: 'SV',
  SMR: 'SM',
  SOM: 'SO',
  SPM: 'PM',
  SRB: 'RS',
  SSD: 'SS',
  STP: 'ST',
  SUR: 'SR',
  SVK: 'SK',
  SVN: 'SI',
  SWE: 'SE',
  SWZ: 'SZ',
  SXM: 'SX',
  SYC: 'SC',
  SYR: 'SY',
  TCA: 'TC',
  TCD: 'TD',
  TGO: 'TG',
  THA: 'TH',
  TJK: 'TJ',
  TKL: 'TK',
  TKM: 'TM',
  TLS: 'TL',
  TON: 'TO',
  TTO: 'TT',
  TUN: 'TN',
  TUR: 'TR',
  TUV: 'TV',
  TWN: 'TW',
  TZA: 'TZ',
  UGA: 'UG',
  UKR: 'UA',
  UMI: 'UM',
  URY: 'UY',
  USA: 'US',
  UZB: 'UZ',
  VAT: 'VA',
  VCT: 'VC',
  VEN: 'VE',
  VGB: 'VG',
  VIR: 'VI',
  VNM: 'VN',
  VUT: 'VU',
  WLF: 'WF',
  WSM: 'WS',
  XKX: 'XK',
  YEM: 'YE',
  ZAF: 'ZA',
  ZMB: 'ZM',
  ZWE: 'ZW',
}

export function parseNumber(number: any) {
  const parsedNumber = isString(number)
    ? parseFloat(number)
    : isNumber(number)
      ? number
      : null
  return isNull(parsedNumber) || isNaN(parsedNumber) ? null : parsedNumber
}

export function applyTransaction(
  api: GridApi,
  transaction: RowDataTransaction<any>,
) {
  try {
    api.applyTransaction(transaction)
  } catch (error) {
    setTimeout(() => {
      api.applyTransaction(transaction)
    }, 0)
  }
}

export function isInViewport(element: Element) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
  )
}

export function debounce(func: any, wait: number = 300, id?: string) {
  if (!isFunction(func)) return
  const name = id || func.name || 'generic'
  if (timer[name]) clearTimeout(timer[name])
  timer[name] = setTimeout(func, wait)
}

export function pendingWorkers(name: string) {
  return !!timer[name]
}

export function scrollToElement(options: {
  behavior?: 'auto' | 'smooth'
  callback?: any
  element?: Element
  offset?: number
  selectors?: string
  wait?: number
}) {
  const { callback, element, offset = 16, selectors, wait = 0 } = options
  setTimeout(() => {
    const el = element || (selectors ? document.querySelector(selectors) : null)
    if (!el) return
    const visible = isInViewport(el)
    if (visible) {
      if (isFunction(callback)) {
        callback()
      }
      return
    }
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    const onScroll = function () {
      debounce(function scrollToElement() {
        if (isInViewport(el)) {
          window.removeEventListener('scroll', onScroll)
          callback()
        }
      }, 50)
    }
    if (isFunction(callback)) {
      window.addEventListener('scroll', onScroll)
      onScroll()
    }
    window.scrollTo({
      behavior: options.behavior || 'smooth',
      top,
    })
  }, wait)
}

export function getError(props: any) {
  if (props.colDef.category === 'usage') {
    if (isObject(props.data.error)) {
      const errors = get(props.data.error, 'record_usages')
      if (isObject(errors) && !isArray(errors)) {
        const error = get(errors, `usage_${props.colDef.id}`)
        return isObject(error) && !isArray(error)
          ? Object.keys(error).map((key) => error[key])
          : error
      }
      return errors
    }
    return null
  }
  if (isObject(props.data.error)) {
    return get(props.data.error, props.colDef.field)
  }
  if (isString(props.data.error) && props.colDef.showRowError) {
    return props.data.error
  }
  return null
}

export function pxToNumber(px: string) {
  if (px.endsWith('px')) {
    const number = parseNumber(px.replace('px', ''))
    return isNumber(number) ? number : 0
  }
  return 0
}

export const getOSName = () => {
  const userAgent = window.navigator.userAgent
  const platform = window.navigator.platform
  const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
  const iosPlatforms = ['iPhone', 'iPad', 'iPod']
  const mobilePlatforms = [
    'Android',
    'webOS',
    'Blackberry',
    'WindowsPhone',
    'WindowsCE',
    'Symbian',
  ]

  if (macPlatforms.indexOf(platform) !== -1) {
    return 'mac'
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'ios'
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'windows'
  } else if (/Android/.test(userAgent)) {
    return 'android'
  } else if (/Linux/.test(platform)) {
    return 'linux'
  } else if (mobilePlatforms.some((mp) => userAgent.indexOf(mp) !== -1)) {
    return 'mobile'
  } else {
    return 'unknown'
  }
}

export function getCountryISO2(countryCode: string) {
  return countryISOMapping[countryCode]
}
