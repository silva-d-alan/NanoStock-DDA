import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fabricante } from './fabricante.entity';
import { FabricantesService } from './fabricantes.service';
import { FabricantesController } from './fabricantes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fabricante])],
  providers: [FabricantesService],
  controllers: [FabricantesController],
  exports: [FabricantesService],
})
export class FabricantesModule {}