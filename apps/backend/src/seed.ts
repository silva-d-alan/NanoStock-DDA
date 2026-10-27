import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from './modules/usuarios/usuario.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get(getRepositoryToken(Usuario));

  const existente = await repo.findOne({ where: { email: 'admin@dda.com' } });
  if (!existente) {
    await repo.save(
      repo.create({
        nome: 'Administrador',
        email: 'admin@dda.com',
        senhaHash: await bcrypt.hash('admin123', 10),
        perfil: 'ADMIN',
      }),
    );
    console.log('✅ Usuário admin criado: admin@dda.com / admin123');
  } else {
    console.log('ℹ️ Usuário admin já existe.');
  }
  await app.close();
  process.exit(0);
}

seed();