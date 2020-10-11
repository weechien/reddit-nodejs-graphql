import React, { useState } from 'react'
import { GetServerSideProps, NextPage } from 'next'
import NextLink from 'next/link'
import { Box, Button, Flex, Link } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { useRouter } from 'next/router'

import { Wrapper } from '../../components/wrapper.component'
import { InputField } from '../../components/inputField.component'
import { useChangePasswordMutation } from '../../generated/graphql'
import { toErrorMap } from '../../utils/toErrorMap.util'

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const router = useRouter()
  const [changePassword] = useChangePasswordMutation()
  const [tokenError, setTokenError] = useState('')

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async ({ newPassword }, { setErrors }) => {
          setTokenError('')
          const response = await changePassword({
            variables: { token, newPassword },
          })
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors)
            if ('token' in errorMap) {
              setTokenError(errorMap.token)
            }
            setErrors(errorMap)
          } else if (response.data?.changePassword.user) {
            router.push('/')
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              placeholder="new password"
              label="New Password"
              type="password"
            />
            {tokenError && (
              <Flex fontSize="sm">
                <Box mr="2" color="red.500">
                  {tokenError}
                </Box>
                <NextLink href="/forgot-password">
                  <Link>click here to get a new one</Link>
                </NextLink>
              </Flex>
            )}
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              variantColor="teal"
            >
              Change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const token = context.query.token as string
  return { props: { token } }
}

export default ChangePassword
