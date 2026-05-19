import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { createApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`✓ API listening on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();