import { ApolloServer } from 'apollo-server-express'
import 'colors'
import 'dotenv-safe/config'
import connectRedis from 'connect-redis'
import cors from 'cors'
import { createUserLoader } from './dataloaders/createUser.dataloader'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import path from 'path'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { createConnection } from 'typeorm'
import { COOKIE_NAME, __prod__ } from './constants'
import { Post } from './entities/Post.entity'
import { Upvote } from './entities/Upvote.entity'
import { User } from './entities/User.entity'
import { PostResolver } from './resolvers/post.resolver'
import { UserResolver } from './resolvers/user.resolver'
import { createUpvoteLoader } from './dataloaders/createUpvote.dataloader'

/**
 * dotenv-safe
 * Identical to dotenv, but ensures that all needed environment variables are defined after reading from .env.
 * The names of the needed variables are read from .env.example, which should be commited along with your project.
 */

// Install gen-env-types then run gen-env to enable static typing for env files

// Run gen-init-migration which reads from ormconfig.json to generate migration for table creation.
// Make sure database has no tables.

const main = async () => {
  /* const conn = */ await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: false,
    // synchronize: true, // Only for dev env
    migrations: [path.join(__dirname, 'migrations/*')],
    entities: [Post, User, Upvote],
  })
  // await conn.runMigrations()

  const app = express()

  const RedisStore = connectRedis(session)
  const redis = new Redis(process.env.REDIS_URL)

  app.set('trust proxy', 1)
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  )

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: 'none',
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      upvoteLoader: createUpvoteLoader(),
    }),
  })
  apolloServer.applyMiddleware({ app, cors: false })

  app.listen(parseInt(process.env.PORT), () => {
    console.log('server started on localhost:4000')
  })
}

main().catch(err => console.log(err))
