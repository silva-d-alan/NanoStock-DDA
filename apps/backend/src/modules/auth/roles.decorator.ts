import { SetMetadata } from '@nestjs/common';
import type { PerfilUsuario } from '@dda/shared-types';

export const ROLES_KEY = 'perfis';

/** RF12 – restringe a rota (ou o controller) aos perfis informados. */
export const Roles = (...perfis: PerfilUsuario[]) => SetMetadata(ROLES_KEY, perfis);
