import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PastilhasModule } from './modules/pastilhas/pastilhas.module';
import { FabricantesModule } from './modules/fabricantes/fabricantes.module';
import { MovimentacoesModule } from './modules/movimentacoes/movimentacoes.module';
import { AlertasModule } from './modules/alertas/alertas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UsuariosModule,
    PastilhasModule,
    FabricantesModule,
    MovimentacoesModule,
    AlertasModule,
    DashboardModule,
  ],
})
export class AppModule {}