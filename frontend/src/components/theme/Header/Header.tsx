import Image from 'next/image'

import { Button } from '@mui/material'
import LanguageSelector from '@ors/components/theme/LanguageSelector/LanguageSelector'

export const Header = () => {
  return (
    <nav>
      <div className="nav-container mx-auto flex justify-between p-4">
        <div className="logo flex items-center">
          <Image
            src="/assets/logos/mlf_icon.png"
            alt="Multilateral Fund"
            width="40"
            height="40"
          />
          <span className="pl-2">MLFS</span>
        </div>
        <div>
          <Button variant="contained" className="bg-slate-500">
            Press
          </Button>
          {/* <LanguageSelector /> */}
        </div>
      </div>
    </nav>
    // <Navbar fluid>
    //   <div className="w-full p-3 lg:px-5 lg:pl-3">
    //     <div className="flex items-center justify-between">
    //       <Navbar.Brand to="/">
    //         <div className="self-center whitespace-nowrap text-xl font-semibold dark:text-white w-10">
    //           <img
    //             src={imgSrc('/assets/logos/mlf_icon.png')}
    //             alt="logo"
    //             className="w-auto h-auto"
    //           />
    //         </div>
    //         <span className="pl-2 dark:text-white">MLFS</span>
    //       </Navbar.Brand>
    //       <div className="flex md:order-2 items-center dark:text-white">
    //         <LangSwitcher />
    //         {user && (
    //           <div className="ml-4">
    //             <UserInfo user={user} onLogout={onConfirmLogout} />
    //           </div>
    //         )}
    //         <div className="ml-2">
    //           <DarkThemeToggle />
    //         </div>
    //         <Navbar.Toggle />
    //       </div>
    //     </div>
    //   </div>
    //   <Navbar.Collapse />
    // </Navbar>
  )
}
