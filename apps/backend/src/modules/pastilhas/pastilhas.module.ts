import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pastilha } from './pastilha.entity';
import { PastilhasService } from './pastilhas.service';
import { PastilhasController } from './pastilhas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pastilha])],
  providers: [PastilhasService],
  controllers: [PastilhasController],
  exports: [PastilhasService],
})
export class PastilhasModule {}