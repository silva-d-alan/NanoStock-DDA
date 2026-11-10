import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  async criar(dados: any) {
    const existe = await this.repo.findOne({ where: { email: dados.email } });
    if (existe) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const usuario = this.repo.create({
      nome: dados.nome,
      email: dados.email,
      senhaHash: senhaHash,
      perfil: dados.perfil || 'ALMOXARIFE',
    });

    const salvo = await this.repo.save(usuario);
    const { senhaHash: _, ...resultado } = salvo;
    return resultado;
  }
  
  async atualizar(id: string, dados: any) {
    const usuario = await this.repo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    if (dados.senha) {
      dados.senhaHash = await bcrypt.hash(dados.senha, 10);
      delete dados.senha;
    }

    Object.assign(usuario, dados);
    return this.repo.save(usuario);
  }

  async remover(id: string) {
    const usuario = await this.repo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    
    if (usuario.email === 'admin@dda.com') {
      throw new ConflictException('O administrador principal não pode ser excluído.');
    }

    return this.repo.remove(usuario);
  }

  findAll() {
    return this.repo.find({ select: ['id', 'nome', 'email', 'perfil', 'ativo'] });
  }
}