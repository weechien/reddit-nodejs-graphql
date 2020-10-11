import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/core'
import { GetServerSideProps } from 'next'
import NextLink from 'next/link'
import React from 'react'
import { EditDeletePostButtons } from '../components/editDeletePostButtons.component'
import { Layout } from '../components/layout.component'
import { UpvoteSection } from '../components/upvoteSection.component'
import {
  PostsDocument,
  useMeQuery,
  usePostsQuery,
  User,
} from '../generated/graphql'
import { initializeApollo } from '../utils/apolloClient.util'
import { isServer } from '../utils/isServer.util'

const Index = () => {
  const { data, loading, error, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 10,
      cursor: null,
    },
    // Re-render component when fetchMore is run and complete
    notifyOnNetworkStatusChange: true,
  })
  const { data: meData } = useMeQuery({
    skip: isServer(),
  })

  if (!data && !loading)
    return (
      <div>
        <div>Query failed for some reason...</div>
        <div>{error?.message}</div>
      </div>
    )
  return (
    <Layout>
      <br />
      <div>
        {!data && loading ? (
          <div>'loading...'</div>
        ) : (
          <Stack spacing={8}>
            {data!.posts.posts.map(post => (
              <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
                <UpvoteSection post={post} me={meData?.me as User | null} />
                <Box flex={1}>
                  <NextLink href="/post/[id]" as={`/post/${post.id}`}>
                    <Link>
                      <Heading fontSize="xl">{post.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>posted by {post.creator.username}</Text>
                  <Flex align="center">
                    <Text flex={1} mt={4}>
                      {post.textSnippet}
                    </Text>
                    <Box ml="auto">
                      <EditDeletePostButtons
                        id={post.id}
                        creatorId={post.creator.id}
                      />
                    </Box>
                  </Flex>
                </Box>
              </Flex>
            ))}
          </Stack>
        )}
        {data && data.posts.hasMore && (
          <Flex>
            <Button
              isLoading={loading}
              m="auto"
              my={8}
              onClick={() => {
                const { posts } = data.posts
                const lastPost = posts[posts.length - 1]

                fetchMore({
                  variables: {
                    limit: variables?.limit,
                    cursor: { id: lastPost.id, createdAt: lastPost.createdAt },
                  },
                })
              }}
            >
              Load more
            </Button>
          </Flex>
        )}
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const apolloClient = initializeApollo(null, ctx)

  await apolloClient.query({
    query: PostsDocument,
    variables: { limit: 10, cursor: null },
  })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}

export default Index
