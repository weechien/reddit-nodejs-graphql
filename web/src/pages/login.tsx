import React from 'react'
import { Formik, Form } from 'formik'
import { Box, Button, Flex, Link } from '@chakra-ui/core'
import { useRouter } from 'next/router'
import NextLink from 'next/link'

import { Wrapper } from '../components/wrapper.component'
import { InputField } from '../components/inputField.component'
import { MeDocument, MeQuery, useLoginMutation } from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap.util'

interface Props {}

const Login: React.FC<Props> = ({}) => {
  const router = useRouter()
  const [login] = useLoginMutation()

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login({
            variables: values,
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: 'Query',
                  me: data?.login.user,
                },
              })
            },
          })

          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors))
          } else if (response.data?.login.user) {
            const { next } = router.query
            router.push(typeof next === 'string' ? next : '/')
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameOrEmail"
              placeholder="username or email"
              label="Username or Email"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>
            <Flex mt="2">
              <NextLink href="/forgot-password">
                <Link ml="auto" fontSize="sm">
                  forgot password?
                </Link>
              </NextLink>
            </Flex>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              variantColor="teal"
            >
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export default Login
