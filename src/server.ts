import { createRequestHandler } from '@netlify/angular-runtime';
import bootstrap from './main.server';

export const handler = createRequestHandler({
  bootstrap,
});
