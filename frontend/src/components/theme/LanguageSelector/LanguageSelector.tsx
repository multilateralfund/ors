'use client'
// import { Dropdown } from 'flowbite-react'

// import { selectLang, setLang } from '@/slices/userSlice'
// import { LANGUAGES, LanguagesKeys, objectKeys } from '@/utils/constants'
// import { useTranslation } from 'react-i18next'
// import { useDispatch, useSelector } from 'react-redux'

import { LANGUAGES, LanguagesKeys } from '@ors/constants'

const LanguageSelector = () => {
  // const dispatch = useDispatch()
  // const { i18n } = useTranslation()
  // const lang = useSelector(selectLang)

  // const currentLanguage =
  //   LANGUAGES[lang as LanguagesKeys]?.nativeName || 'English'

  // const handleChangeLanguage = (lang: LanguagesKeys) => {
  //   i18n.changeLanguage(lang)
  //   dispatch(setLang({ lang }))
  // }

  // return (
  //   <Dropdown label={currentLanguage} inline>
  //     {objectKeys(LANGUAGES).map((lng) => (
  //       <Dropdown.Item key={lng} onClick={() => handleChangeLanguage(lng)}>
  //         {LANGUAGES[lng].nativeName}
  //       </Dropdown.Item>
  //     ))}
  //   </Dropdown>
  // )

  return (
    <></>
    // <Menu>
    //   {Object.entries(LANGUAGES).map(([key, lang]) => (
    //     <MenuItem key={key}>{key}</MenuItem>
    //   ))}
    // </Menu>
  )
}

export default LanguageSelector
