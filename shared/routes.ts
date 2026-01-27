import { z } from 'zod';
import { insertConfessionSchema, insertCommentSchema, confessions, comments } from '../shared/schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  confessions: {
    list: {
      method: 'GET' as const,
      path: '/api/confessions',
      input: z.object({
        sort: z.enum(['popular', 'controversial', 'newest']).optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        cursor: z.string().optional() // For simple pagination if needed later
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof confessions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/confessions/:id',
      responses: {
        200: z.custom<typeof confessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/confessions',
      input: insertConfessionSchema,
      responses: {
        201: z.custom<typeof confessions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    vote: {
      method: 'POST' as const,
      path: '/api/confessions/:id/vote',
      input: z.object({
        type: z.enum(['meToo', 'nope'])
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          meTooCount: z.number(),
          nopeCount: z.number()
        }),
        404: errorSchemas.notFound,
      }
    }
  },
  comments: {
    list: {
      method: 'GET' as const,
      path: '/api/confessions/:id/comments',
      responses: {
        200: z.array(z.custom<typeof comments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/confessions/:id/comments',
      input: insertCommentSchema.omit({ confessionId: true }),
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    like: {
      method: 'POST' as const,
      path: '/api/comments/:id/like',
      responses: {
        200: z.object({
          success: z.boolean(),
          likes: z.number()
        }),
        404: errorSchemas.notFound,
      }
    }
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          totalConfessions: z.number(),
          totalVotes: z.number()
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
