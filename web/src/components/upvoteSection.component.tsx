import { ApolloCache, gql } from '@apollo/client'
import { Flex, IconButton } from '@chakra-ui/core'
import React, { useState } from 'react'
import {
  PostSnippetFragment,
  User,
  useVoteMutation,
  VoteMutation,
} from '../generated/graphql'

interface Props {
  post: PostSnippetFragment
  me: User | null
}

const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const data = cache.readFragment<{
    id: number
    points: number
    voteStatus: number | null
  }>({
    id: `Post:${postId}`,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  })

  if (data) {
    if (data.voteStatus === value) return

    const newPoints = data.points + (data.voteStatus ? 2 : 1) * value
    cache.writeFragment({
      id: `Post:${postId}`,
      fragment: gql`
        fragment __ on Post {
          points
          voteStatus
        }
      `,
      data: { points: newPoints, voteStatus: value },
    })
  }
}

export const UpvoteSection: React.FC<Props> = ({ post, me }) => {
  const [vote] = useVoteMutation()
  const [loadingState, setLoadingState] = useState<
    'upvote-loading' | 'downvote-loading' | 'not-loading'
  >('not-loading')

  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === 1 || !me) return
          setLoadingState('upvote-loading')
          await vote({
            variables: {
              postId: post.id,
              value: 1,
            },
            update: cache => updateAfterVote(1, post.id, cache),
          })
          setLoadingState('not-loading')
        }}
        variantColor={post.voteStatus === 1 ? 'green' : undefined}
        isLoading={loadingState === 'upvote-loading'}
        aria-label="upvote post"
        icon="chevron-up"
      />
      {post.points}
      <IconButton
        onClick={async () => {
          if (post.voteStatus === -1 || !me) return
          setLoadingState('downvote-loading')
          await vote({
            variables: {
              postId: post.id,
              value: -1,
            },
            update: cache => updateAfterVote(-1, post.id, cache),
          })
          setLoadingState('not-loading')
        }}
        variantColor={post.voteStatus === -1 ? 'red' : undefined}
        isLoading={loadingState === 'downvote-loading'}
        aria-label="downvote post"
        icon="chevron-down"
      />
    </Flex>
  )
}
