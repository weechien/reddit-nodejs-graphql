import { User } from '../entities/User.entity'
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql'
import { getConnection } from 'typeorm'
import { MyContext } from 'types'
import { Post } from '../entities/Post.entity'
import { Upvote } from '../entities/Upvote.entity'
import { isAuth } from '../middlewares/isAuth.middleware'

@InputType()
class Cursor {
  @Field()
  id: number
  @Field()
  createdAt: string
}

@InputType()
class PostInput {
  @Field()
  title: string
  @Field()
  text: string
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[]

  @Field()
  hasMore: boolean
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50) + '...'
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId)
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { upvoteLoader, req }: MyContext
  ) {
    if (!req.session.userId) return null
    const upvote = await upvoteLoader.load({
      postId: post.id,
      userId: req.session.userId,
    })
    return upvote?.value
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('cursor', () => Cursor, { nullable: true }) cursor?: Cursor | null
  ): Promise<PaginatedPosts> {
    const maxLimit = Math.min(50, limit)
    const maxLimitPlusOne = maxLimit + 1

    // Join post table with user table
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.creator', 'u', 'u.id = p.creatorId')
      .orderBy({ 'p.createdAt': 'DESC', 'p.id': 'DESC' })
      .take(maxLimitPlusOne)

    if (cursor) {
      qb.where('p.createdAt < :createdAt OR p.id < :id', {
        createdAt: new Date(parseInt(cursor.createdAt)),
        id: cursor.id,
      })
    }
    const posts = await qb.getMany()

    return {
      posts: posts.slice(0, maxLimit),
      hasMore: posts.length === maxLimitPlusOne,
    }
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id)
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session
    const updateVal = Math.min(Math.max(value, -1), 1)
    const upvote = await Upvote.findOne({ where: { postId, userId } })

    if (upvote && upvote.value !== updateVal) {
      await Upvote.update({ postId, userId }, { value: updateVal })
      await getConnection()
        .createQueryBuilder()
        .update(Post)
        .where('id = :id', { id: postId })
        .set({ points: () => `points + ${updateVal * 2}` })
        .execute()
    } else if (!upvote) {
      Upvote.insert({
        userId,
        postId,
        value: updateVal,
      })
      await getConnection()
        .createQueryBuilder()
        .update(Post)
        .where('id = :id', { id: postId })
        .set({ points: () => `points + ${updateVal}` })
        .execute()
    }
    return true
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({ ...input, creatorId: req.session.userId }).save()
    // Same result but using query builder
    // const result = await getConnection()
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Post)
    //   .values({
    //     ...input,
    //   })
    //   .returning('*')
    //   .execute()
    // return result.raw[0]
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and creatorId = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute()
    return result.raw[0]
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    await Post.delete({ id, creatorId: req.session.userId })
    return true
  }
}
