import DataLoader from 'dataloader'
import { Upvote } from '../entities/Upvote.entity'

export const createUpvoteLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Upvote | null>(
    async keys => {
      const upvotes = await Upvote.findByIds(keys as any)
      const upvoteMap: Record<string, Upvote> = {}
      upvotes.forEach(
        upvote => (upvoteMap[`${upvote.userId}|${upvote.postId}`] = upvote)
      )
      return keys.map(key => upvoteMap[`${key.userId}|${key.postId}`])
    }
  )
