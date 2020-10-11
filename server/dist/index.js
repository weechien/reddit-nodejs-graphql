"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
require("colors");
require("dotenv-safe/config");
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const createUser_dataloader_1 = require("./dataloaders/createUser.dataloader");
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
require("reflect-metadata");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const constants_1 = require("./constants");
const Post_entity_1 = require("./entities/Post.entity");
const Upvote_entity_1 = require("./entities/Upvote.entity");
const User_entity_1 = require("./entities/User.entity");
const post_resolver_1 = require("./resolvers/post.resolver");
const user_resolver_1 = require("./resolvers/user.resolver");
const createUpvote_dataloader_1 = require("./dataloaders/createUpvote.dataloader");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    yield typeorm_1.createConnection({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        logging: false,
        migrations: [path_1.default.join(__dirname, 'migrations/*')],
        entities: [Post_entity_1.Post, User_entity_1.User, Upvote_entity_1.Upvote],
    });
    const app = express_1.default();
    const RedisStore = connect_redis_1.default(express_session_1.default);
    const redis = new ioredis_1.default(process.env.REDIS_URL);
    app.set('trust proxy', 1);
    app.use(cors_1.default({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }));
    app.use(express_session_1.default({
        name: constants_1.COOKIE_NAME,
        store: new RedisStore({
            client: redis,
            disableTouch: true,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365,
            httpOnly: true,
            sameSite: 'none',
            secure: constants_1.__prod__,
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: yield type_graphql_1.buildSchema({
            resolvers: [post_resolver_1.PostResolver, user_resolver_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: createUser_dataloader_1.createUserLoader(),
            upvoteLoader: createUpvote_dataloader_1.createUpvoteLoader(),
        }),
    });
    apolloServer.applyMiddleware({ app, cors: false });
    app.listen(parseInt(process.env.PORT), () => {
        console.log('server started on localhost:4000');
    });
});
main().catch(err => console.log(err));
//# sourceMappingURL=index.js.map