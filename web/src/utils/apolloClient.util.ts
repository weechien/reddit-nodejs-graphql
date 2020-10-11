import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client'
import { onError } from '@apollo/link-error'
import { GetServerSidePropsContext } from 'next'
import { useMemo } from 'react'
import { PaginatedPosts } from '../generated/graphql'
import { isServer } from './isServer.util'

// Global error handler
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    })
  if (networkError) console.log(`[Network error]: ${networkError}`)
})

let apolloClient: ApolloClient<NormalizedCacheObject>

const createApolloClient = (ctx: GetServerSidePropsContext | null = null) =>
  new ApolloClient({
    ssrMode: isServer(),
    link: ApolloLink.from([
      errorLink,
      new HttpLink({
        uri: process.env.NEXT_PUBLIC_API_URL,
        credentials: 'include',
        headers: {
          cookie: isServer() ? ctx?.req?.headers.cookie || '' : undefined,
        },
      }),
    ]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            posts: {
              keyArgs: [],
              merge(
                existing: PaginatedPosts | undefined,
                incoming: PaginatedPosts
              ): PaginatedPosts {
                return {
                  ...incoming,
                  posts: [...(existing?.posts || []), ...incoming.posts],
                }
              },
            },
          },
        },
      },
    }),
  })

export const initializeApollo = (
  initialState: NormalizedCacheObject | null = null,
  ctx: GetServerSidePropsContext | null = null
) => {
  const _apolloClient = apolloClient ?? createApolloClient(ctx)

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract()
    // Restore the cache using the data passed from getStaticProps/getServerSideProps
    // combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState })
  }
  // For SSG and SSR always create a new Apollo Client
  if (isServer()) return _apolloClient
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient

  return _apolloClient
}

export const useApollo = (initialState: NormalizedCacheObject) => {
  const store = useMemo(() => initializeApollo(initialState), [initialState])
  return store
}
