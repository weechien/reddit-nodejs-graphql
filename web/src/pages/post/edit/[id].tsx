import { Box, Button } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import { InputField } from '../../../components/inputField.component'
import { Layout } from '../../../components/layout.component'
import { usePostQuery, useUpdatePostMutation } from '../../../generated/graphql'

const EditPost: NextPage<{ id: number }> = ({ id }) => {
  const router = useRouter()
  const intId = typeof id === 'string' ? parseInt(id) : -1
  const { data, loading } = usePostQuery({
    skip: intId === -1,
    variables: { id: intId },
  })
  const [updatePost] = useUpdatePostMutation()

  if (loading)
    return (
      <Layout>
        <Box>loading...</Box>
      </Layout>
    )
  if (!data?.post)
    return (
      <Layout>
        <Box>Could not find post</Box>
      </Layout>
    )

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async values => {
          await updatePost({ variables: { id: intId, ...values } })
          router.back()
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
              Update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const id = context.query.id as string
  return { props: { id } }
}

export default EditPost
