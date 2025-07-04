// src/api.js
import Fastify from 'fastify';
import { listPlugins, enablePlugin, disablePlugin } from '../plugin-manager.js';
import { scan } from '../index.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';

export function buildServer({ port = 3000 } = {}) {
  const app = Fastify({ logger: true });

  // Register Swagger definitions
  app.register(
    fastifySwagger,
    {
      mode: 'static',
      specification: {
        document: parseYaml(readFileSync(join(process.cwd(), '.github', 'openapi.yaml'), 'utf8')),
      },
    },
    (err) => {
      if (err) {
        app.log.error(err);
        throw err;
      }
      // Register Swagger UI only after Swagger definitions are loaded
      app.register(fastifySwaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
        },
      });
    }
  );

  app.put('/plugins/:name/enable', async (req, reply) => {
    try {
      const { name } = req.params;
      await enablePlugin(name);
      reply.status(204).send();
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({ error: err.message });
    }
  });

  app.put('/plugins/:name/disable', async (req, reply) => {
    try {
      const { name } = req.params;
      await disablePlugin(name);
      reply.status(204).send();
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({ error: err.message });
    }
  });

  app.get('/plugins', async (req, reply) => {
    try {
      const plugins = await listPlugins();
      return plugins;
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({ error: err.message });
    }
  });

  app.post(
    '/scan',
    {
      schema: {
        body: {
          type: 'object',
          required: ['target'],
          properties: {
            target: {
              type: ['string', 'array'],
              items: { type: 'string' },
            },
            mode: { type: 'string', enum: ['fast', 'complete'] },
            json: { type: 'boolean' },
            plugin: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { target, mode, json, plugin } = req.body;
        const resolvedTarget = Array.isArray(target)
          ? target.map((t) => resolve(process.cwd(), t))
          : resolve(process.cwd(), target);
        const result = await scan(resolvedTarget, { mode, json, plugin });
        return result;
      } catch (err) {
        req.log.error(err);
        reply.status(500).send({ error: err.message });
      }
    }
  );

  // Server-Sent Events (SSE) endpoint for streaming scan progress
  app.get('/scan/stream', async (req, reply) => {
    const { target, mode, json, plugin } = req.query;
    const resolvedTarget = Array.isArray(target)
      ? target.map((t) => resolve(process.cwd(), t))
      : resolve(process.cwd(), target);
    // Start scan in stream mode
    const emitter = await scan(resolvedTarget, { mode, json, stream: true, plugin });

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    // Flush headers to establish the SSE stream
    reply.raw.flushHeaders();

    // Helper to send an event
    const sendEvent = (event, data) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    emitter.on('start', (data) => sendEvent('start', data));
    emitter.on('pluginResult', (data) => sendEvent('pluginResult', data));
    emitter.on('complete', (data) => {
      sendEvent('complete', data);
      reply.raw.end();
    });
  });

  return app;
}

// Start the server if this file is run directly
buildServer()
  .listen({ port: 3000 })
  .then(() => {
    console.log('🚀 API listening on http://localhost:3000');
  });
