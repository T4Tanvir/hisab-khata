import { Hono } from 'hono';
import { categoriesService } from './categories.service';
import { requireAuth, type AuthContext } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { createCategorySchema, updateCategorySchema, type CategoryType } from '@hisab/shared';

export const categoriesRoutes = new Hono<AuthContext>();

// Require authentication on all category routes
categoriesRoutes.use('*', requireAuth);

// GET /api/categories - List user categories (optional ?type=income|expense)
categoriesRoutes.get('/', async (c) => {
  const user = c.get('user');
  const typeQuery = c.req.query('type') as CategoryType | undefined;
  const categories = await categoriesService.getUserCategories(user.id, typeQuery);
  return c.json({ data: categories });
});

// POST /api/categories - Create a new category
categoriesRoutes.post('/', validateBody(createCategorySchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody' as any);
  const created = await categoriesService.createCategory(user.id, body);
  return c.json({ data: created }, 201);
});

// PATCH /api/categories/:id - Update an existing category
categoriesRoutes.patch('/:id', validateBody(updateCategorySchema), async (c) => {
  const user = c.get('user');
  const categoryId = c.req.param('id');
  const body = c.get('validatedBody' as any);

  const updated = await categoriesService.updateCategory(user.id, categoryId, body);
  if (!updated) {
    return c.json(
      {
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }

  return c.json({ data: updated });
});

// DELETE /api/categories/:id - Delete or archive a category
categoriesRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const categoryId = c.req.param('id');

  const result = await categoriesService.deleteCategory(user.id, categoryId);
  if (!result) {
    return c.json(
      {
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি',
        },
      },
      404
    );
  }

  return c.json({
    data: {
      message: result.archived
        ? 'ব্যবহারিত হওয়ায় ক্যাটাগরিটি আর্কাইভ করা হয়েছে'
        : 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে',
      ...result,
    },
  });
});
