import DataLoader from 'dataloader'
import { User } from '../entities/User.entity'

export const createUserLoader = () =>
  new DataLoader<number, User>(async userIds => {
    const users = await User.findByIds(userIds as number[])
    const userMap: Record<number, User> = {}
    users.forEach(user => (userMap[user.id] = user))
    return userIds.map(userId => userMap[userId])
  })
