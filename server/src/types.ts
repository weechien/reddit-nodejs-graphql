import { createUserLoader } from './dataloaders/createUser.dataloader'
import { Request, Response } from 'express'
import { Redis } from 'ioredis'
import { createUpvoteLoader } from './dataloaders/createUpvote.dataloader'

export type MyContext = {
  req: Request & { session: Express.Session }
  res: Response
  redis: Redis
  userLoader: ReturnType<typeof createUserLoader>
  upvoteLoader: ReturnType<typeof createUpvoteLoader>
}
