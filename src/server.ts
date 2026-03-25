import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { getContext } from '@netlify/angular-runtime';

const angularAppEngine = new AngularAppEngine();

export default createRequestHandler(async (request) => {
  const context = getContext();

  const result = await angularAppEngine.handle(request, context);
  return result || new Response('Not found', { status: 404 });
});
