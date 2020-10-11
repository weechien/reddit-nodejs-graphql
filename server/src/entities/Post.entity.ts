import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm'
import { ObjectType, Field } from 'type-graphql'
import { User } from './User.entity'
import { Upvote } from './Upvote.entity'

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column()
  title!: string

  @Field()
  @Column()
  text!: string

  @Field()
  @Column({ type: 'int', default: 0 })
  points!: number

  @Field()
  @Column()
  creatorId: number

  @Field(() => User)
  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'creatorId' })
  creator: User

  @OneToMany(() => Upvote, upvote => upvote.post)
  upvotes: Upvote[]

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date
}
