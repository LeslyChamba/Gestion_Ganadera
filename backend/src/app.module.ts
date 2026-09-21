import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalesModule } from './animales/animales.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { TimelineModule } from './timeline/timeline.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'reproductivo'),
        password: config.get<string>('DB_PASSWORD', 'reproductivo'),
        database: config.get<string>('DB_NAME', 'reproductivo'),
        autoLoadEntities: true,
        synchronize: false, // el esquema se gestiona con database/schema.sql
      }),
    }),
    CatalogosModule,
    AnimalesModule,
    TimelineModule,
  ],
})
export class AppModule {}
