import React from 'react'
import { GetServerSideProps, NextPage } from 'next'
import { Layout } from '../../components/layout.component'
import { usePostQuery } from '../../generated/graphql'
import { Box, Heading } from '@chakra-ui/core'
import { EditDeletePostButtons } from '../../components/editDeletePostButtons.component'

const Post: NextPage<{ id: number }> = ({ id }) => {
  const intId = typeof id === 'string' ? parseInt(id) : -1
  const { data, loading } = usePostQuery({
    skip: intId === -1,
    variables: { id: intId },
  })

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
    <Layout>
      <Heading mb={4}>{data.post.title}</Heading>
      <Box mb={4}>{data.post.text}</Box>
      <EditDeletePostButtons
        id={data.post.id}
        creatorId={data.post.creator.id}
      />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const id = context.query.id as string
  return { props: { id } }
}

export default Post
