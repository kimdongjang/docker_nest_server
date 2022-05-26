import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { EjsAdapter } from "@nestjs-modules/mailer/dist/adapters/ejs.adapter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as path from "path";
import { AuthModule } from "./auth/auth.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth/auth.service";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { APP_GUARD } from "@nestjs/core";
import { LoggerMiddleware } from "./logger.middleware";
import { join } from "path";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { UsersModule } from "./users/users.module";
import { DatabaseModule } from "./database/database.module";
import emailConfig from "./config/email.config";
import Joi from "@hapi/joi";
import { EventsModule } from "./event/events.module";

// providers: nest injector에 의해 인스턴스화되고 모듈에서 공유되는 provider
// controller: 인스턴스화해야하는 컨트롤러 세트
// imports: 이 모듈에 필요한 공급자의 모듈 목록
// exports: 모든 모듈은 자동적으로 모든 모듈에서 재사용할 수 있는 공유 모듈이 되는데, 이 모듈의 인스턴스를 다른 모듈에서 사용할 수 있도록 지정
@Module({
  imports: [
    // 동적 모듈 = ConfigModule의 forRoot 메서드는 DynamicModule을 리턴하는 정적 메서드임
    ConfigModule.forRoot({
      isGlobal: true,
      load: [emailConfig],
      envFilePath: process.env.NODE_ENV === "production" ? ".production.env" : ".development.env",
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().required(),
        DATABASE_USERNAME: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),

        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          ...config.get("email"),
          template: {
            dir: path.join(__dirname, "/templates/"),
            adapter: new EjsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
    AuthModule,
    UsersModule,
    DatabaseModule,
    EventsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule implements NestModule {
  constructor(private connection: Connection) {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("/users");
  }
}
