import {
  Entity,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Column,
} from 'typeorm'
import { User } from './User.entity'
import { Post } from './Post.entity'

@Entity()
export class Upvote extends BaseEntity {
  @Column({ type: 'int' })
  value: number

  @PrimaryColumn()
  userId: number

  @ManyToOne(() => User, user => user.upvotes)
  @JoinColumn({ name: 'userId' })
  user: User

  @PrimaryColumn()
  postId: number

  @ManyToOne(() => Post, post => post.upvotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post
}
