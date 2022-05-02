import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./passsport/jwt-auth.guard";
import { GoogleStrategy } from "./passsport/google.strategy";
import { JwtStrategy } from "./passsport/jwt.strategy";
import { UsersModule } from "src/users/users.module";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";
import { UserEntity } from "src/users/entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LocalStrategy } from "./passsport/local.strategy";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_ACCESS_TOKEN_SECRET"),
        signOptions: {
          expiresIn: `${configService.get(
            "JWT_ACCESS_TOKEN_EXPIRATION_TIME"
          )}s`,
        },
      }),
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, LocalStrategy],
  exports: [AuthService, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
