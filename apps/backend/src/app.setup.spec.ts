import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { configurarApp } from './app.setup';

describe('configurarApp', () => {
  it('CT57 - RNF08: a API REST é versionada na URI (/v1) e valida as requisições', () => {
    const app = createMock<INestApplication>();

    configurarApp(app);

    expect(app.enableVersioning).toHaveBeenCalledWith({ type: VersioningType.URI, defaultVersion: '1' });
    expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
  });
});
