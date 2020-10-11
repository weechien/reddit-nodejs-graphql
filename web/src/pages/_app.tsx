import { ThemeProvider, CSSReset } from '@chakra-ui/core'
import { ApolloProvider } from '@apollo/client'

import theme from '../theme'
import { useApollo } from '../utils/apolloClient.util'

const MyApp = ({ Component, pageProps }: any) => {
  const apolloClient = useApollo(pageProps.initialApolloState)

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <CSSReset />
        <Component {...pageProps} />
      </ThemeProvider>
    </ApolloProvider>
  )
}

export default MyApp
