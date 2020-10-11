import React from 'react'
import { NavBar } from './navBar.component'
import { Wrapper, WrapperVariant } from './wrapper.component'

interface Props {
  variant?: WrapperVariant
}

export const Layout: React.FC<Props> = ({ children, variant }) => {
  return (
    <>
      <NavBar />
      <Wrapper variant={variant}>{children}</Wrapper>
    </>
  )
}
