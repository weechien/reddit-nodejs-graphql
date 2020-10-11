import argon2 from 'argon2'
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import { v4 } from 'uuid'
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from '../constants'
import { User } from '../entities/User.entity'
import { UsernamePasswordInput } from '../inputs/usernamePassword.input'
import { MyContext } from '../types'
import { sendEmail } from '../utils/sendEmail.util'
import { validateRegister } from '../utils/validateRegister.util'

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email
    }
    return ''
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) return null
    return User.findOne(req.session.userId)
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options)
    if (errors) return { errors }

    const hashedPassword = await argon2.hash(options.password)
    let user

    try {
      user = await User.create({
        username: options.username,
        email: options.email,
        password: hashedPassword,
      }).save()
      // Same result but using query builder
      // const result = await getConnection()
      //   .createQueryBuilder()
      //   .insert()
      //   .into(User)
      //   .values({
      //     username: options.username,
      //     email: options.email,
      //     password: hashedPassword,
      //   })
      //   .returning('*')
      //   .execute()
      // user = result.raw[0]
      req.session.userId = user.id
    } catch (err) {
      if (err.code === '23505') {
        return {
          errors: [
            {
              field: 'username',
              message: 'username already taken',
            },
          ],
        }
      }
    }
    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    })
    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: 'that username does not exist',
          },
        ],
      }
    }
    const valid = await argon2.verify(user.password, password)
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      }
    }
    req.session.userId = user.id
    return { user }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
    return new Promise(resolve =>
      req.session.destroy(err => {
        if (err) {
          console.log(err)
          return resolve(false)
        }
        res.clearCookie(COOKIE_NAME)
        resolve(true)
      })
    )
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ): Promise<boolean> {
    const user = await User.findOne({ where: { email } })

    if (!user) {
      return true
    }
    const token = v4()
    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24
    ) // 1 day
    await sendEmail(
      user.email,
      `<a href="${process.env.CORS_ORIGIN}/change-password/${token}">reset password</a>`
    )
    return true
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { req, redis }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length must be greater than 2',
          },
        ],
      }
    }
    const key = FORGOT_PASSWORD_PREFIX + token
    const userId = await redis.get(key)
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token is invalid or expired',
          },
        ],
      }
    }
    const userIdNum = Number(userId)
    const user = await User.findOne({ where: { id: userIdNum } })

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      }
    }

    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    )

    await redis.del(key)
    req.session.userId = userIdNum // login after change password

    return { user }
  }
}
