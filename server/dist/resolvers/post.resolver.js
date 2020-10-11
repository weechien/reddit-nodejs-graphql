"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResolver = void 0;
const User_entity_1 = require("../entities/User.entity");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const Post_entity_1 = require("../entities/Post.entity");
const Upvote_entity_1 = require("../entities/Upvote.entity");
const isAuth_middleware_1 = require("../middlewares/isAuth.middleware");
let Cursor = class Cursor {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Number)
], Cursor.prototype, "id", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], Cursor.prototype, "createdAt", void 0);
Cursor = __decorate([
    type_graphql_1.InputType()
], Cursor);
let PostInput = class PostInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "text", void 0);
PostInput = __decorate([
    type_graphql_1.InputType()
], PostInput);
let PaginatedPosts = class PaginatedPosts {
};
__decorate([
    type_graphql_1.Field(() => [Post_entity_1.Post]),
    __metadata("design:type", Array)
], PaginatedPosts.prototype, "posts", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Boolean)
], PaginatedPosts.prototype, "hasMore", void 0);
PaginatedPosts = __decorate([
    type_graphql_1.ObjectType()
], PaginatedPosts);
let PostResolver = class PostResolver {
    textSnippet(root) {
        return root.text.slice(0, 50) + '...';
    }
    creator(post, { userLoader }) {
        return userLoader.load(post.creatorId);
    }
    voteStatus(post, { upvoteLoader, req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.session.userId)
                return null;
            const upvote = yield upvoteLoader.load({
                postId: post.id,
                userId: req.session.userId,
            });
            return upvote === null || upvote === void 0 ? void 0 : upvote.value;
        });
    }
    posts(limit, cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            const maxLimit = Math.min(50, limit);
            const maxLimitPlusOne = maxLimit + 1;
            const qb = typeorm_1.getConnection()
                .getRepository(Post_entity_1.Post)
                .createQueryBuilder('p')
                .leftJoinAndSelect('p.creator', 'u', 'u.id = p.creatorId')
                .orderBy({ 'p.createdAt': 'DESC', 'p.id': 'DESC' })
                .take(maxLimitPlusOne);
            if (cursor) {
                qb.where('p.createdAt < :createdAt OR p.id < :id', {
                    createdAt: new Date(parseInt(cursor.createdAt)),
                    id: cursor.id,
                });
            }
            const posts = yield qb.getMany();
            return {
                posts: posts.slice(0, maxLimit),
                hasMore: posts.length === maxLimitPlusOne,
            };
        });
    }
    post(id) {
        return Post_entity_1.Post.findOne(id);
    }
    vote(postId, value, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.session;
            const updateVal = Math.min(Math.max(value, -1), 1);
            const upvote = yield Upvote_entity_1.Upvote.findOne({ where: { postId, userId } });
            if (upvote && upvote.value !== updateVal) {
                yield Upvote_entity_1.Upvote.update({ postId, userId }, { value: updateVal });
                yield typeorm_1.getConnection()
                    .createQueryBuilder()
                    .update(Post_entity_1.Post)
                    .where('id = :id', { id: postId })
                    .set({ points: () => `points + ${updateVal * 2}` })
                    .execute();
            }
            else if (!upvote) {
                Upvote_entity_1.Upvote.insert({
                    userId,
                    postId,
                    value: updateVal,
                });
                yield typeorm_1.getConnection()
                    .createQueryBuilder()
                    .update(Post_entity_1.Post)
                    .where('id = :id', { id: postId })
                    .set({ points: () => `points + ${updateVal}` })
                    .execute();
            }
            return true;
        });
    }
    createPost(input, { req }) {
        return Post_entity_1.Post.create(Object.assign(Object.assign({}, input), { creatorId: req.session.userId })).save();
    }
    updatePost(id, title, text, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield typeorm_1.getConnection()
                .createQueryBuilder()
                .update(Post_entity_1.Post)
                .set({ title, text })
                .where('id = :id and creatorId = :creatorId', {
                id,
                creatorId: req.session.userId,
            })
                .returning('*')
                .execute();
            return result.raw[0];
        });
    }
    deletePost(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Post_entity_1.Post.delete({ id, creatorId: req.session.userId });
            return true;
        });
    }
};
__decorate([
    type_graphql_1.FieldResolver(() => String),
    __param(0, type_graphql_1.Root()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_entity_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textSnippet", null);
__decorate([
    type_graphql_1.FieldResolver(() => User_entity_1.User),
    __param(0, type_graphql_1.Root()), __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_entity_1.Post, Object]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "creator", null);
__decorate([
    type_graphql_1.FieldResolver(() => type_graphql_1.Int, { nullable: true }),
    __param(0, type_graphql_1.Root()),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_entity_1.Post, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "voteStatus", null);
__decorate([
    type_graphql_1.Query(() => PaginatedPosts),
    __param(0, type_graphql_1.Arg('limit', () => type_graphql_1.Int, { defaultValue: 10 })),
    __param(1, type_graphql_1.Arg('cursor', () => Cursor, { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "posts", null);
__decorate([
    type_graphql_1.Query(() => Post_entity_1.Post, { nullable: true }),
    __param(0, type_graphql_1.Arg('id', () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "post", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_middleware_1.isAuth),
    __param(0, type_graphql_1.Arg('postId', () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg('value', () => type_graphql_1.Int)),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
__decorate([
    type_graphql_1.Mutation(() => Post_entity_1.Post),
    type_graphql_1.UseMiddleware(isAuth_middleware_1.isAuth),
    __param(0, type_graphql_1.Arg('input')),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    type_graphql_1.Mutation(() => Post_entity_1.Post, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_middleware_1.isAuth),
    __param(0, type_graphql_1.Arg('id', () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg('title')),
    __param(2, type_graphql_1.Arg('text')),
    __param(3, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_middleware_1.isAuth),
    __param(0, type_graphql_1.Arg('id', () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
PostResolver = __decorate([
    type_graphql_1.Resolver(Post_entity_1.Post)
], PostResolver);
exports.PostResolver = PostResolver;
//# sourceMappingURL=post.resolver.js.map