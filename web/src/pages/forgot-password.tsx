import { Box, Button } from '@chakra-ui/core'
import { Formik, Form } from 'formik'
import React, { useState } from 'react'
import { InputField } from '../components/inputField.component'
import { Wrapper } from '../components/wrapper.component'
import { useForgotPasswordMutation } from '../generated/graphql'

const ForgotPassword: React.FC<{}> = ({}) => {
  const [complete, setComplete] = useState(false)
  const [forgotPassword] = useForgotPasswordMutation()
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: '' }}
        onSubmit={async values => {
          await forgotPassword({
            variables: values,
          })
          setComplete(true)
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box>
              We have sent you an e-mail containing your password reset link.
              Follow the link to reset your password.
            </Box>
          ) : (
            <Form>
              <InputField
                name="email"
                placeholder="email"
                label="Email"
                type="email"
              />
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                variantColor="teal"
              >
                Forgot password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  )
}

export default ForgotPassword
