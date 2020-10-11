import { Box, Button } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { useRouter } from 'next/router'
import React from 'react'
import { InputField } from '../components/inputField.component'
import { Layout } from '../components/layout.component'
import { useCreatePostMutation } from '../generated/graphql'
import { useIsAuth } from '../hooks/useIsAuth.hooks'

const CreatePost: React.FC<{}> = ({}) => {
  useIsAuth()
  const router = useRouter()
  const [createPost] = useCreatePostMutation({
    // Retain network errors, but silence graphql errors
    // Graphql errros will appear in response.errors
    errorPolicy: 'all',
  })

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: '', text: '' }}
        onSubmit={async (values, { setErrors }) => {
          const errs = Object.entries(values).reduce(
            (prev, [key, val]) =>
              val ? prev : { ...prev, [key]: `Input cannot be empty` },
            {}
          )
          if (Object(errs).length) return setErrors(errs)

          const { errors } = await createPost({
            variables: { input: values },
          })
          if (!errors) router.push('/')
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                textarea
                name="text"
                placeholder="text..."
                label="Body"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              variantColor="teal"
            >
              Create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  )
}

export default CreatePost
