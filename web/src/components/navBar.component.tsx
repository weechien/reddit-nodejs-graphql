import React from 'react'
import { Box, Link, Flex, Button, Heading } from '@chakra-ui/core'
import NextLink from 'next/link'
import { useLogoutMutation, useMeQuery } from '../generated/graphql'
import { useApolloClient } from '@apollo/client'
import { isServer } from '../utils/isServer.util'

interface Props {}

export const NavBar: React.FC<Props> = ({}) => {
  const apolloClient = useApolloClient()
  const [logout, { loading: logoutLoading }] = useLogoutMutation()
  const { data } = useMeQuery({ skip: isServer() })
  let body = null

  if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2}>login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>register</Link>
        </NextLink>
      </>
    )
  } else {
    body = (
      <Flex align="center">
        <NextLink href="/create-post">
          <Button as={Link} mr={4}>
            Create Post
          </Button>
        </NextLink>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          onClick={async () => {
            await logout()
            await apolloClient.resetStore()
          }}
          isLoading={logoutLoading}
          variant="link"
        >
          logout
        </Button>
      </Flex>
    )
  }

  return (
    <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4}>
      <Flex flex={1} m="auto" align="center" maxW={800}>
        <NextLink href="/">
          <Link>
            <Heading>Reddit Clone</Heading>
          </Link>
        </NextLink>
        <Box ml={'auto'}>{body}</Box>
      </Flex>
    </Flex>
  )
}
