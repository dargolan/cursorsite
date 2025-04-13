import { factories } from '@strapi/strapi';

export default {
  async find(ctx) {
    try {
      const { query } = ctx;
      const stems = await strapi.entityService.findMany('api::stem.stem', {
        ...query,
        populate: ['track'],
      });
      return stems;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const stem = await strapi.entityService.findOne('api::stem.stem', id, {
        populate: ['track'],
      });
      return stem;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async create(ctx) {
    try {
      const { data } = ctx.request.body;
      const stem = await strapi.entityService.create('api::stem.stem', {
        data: {
          ...data,
          publishedAt: new Date(),
        },
        populate: ['track'],
      });
      return stem;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      const stem = await strapi.entityService.update('api::stem.stem', id, {
        data,
        populate: ['track'],
      });
      return stem;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const stem = await strapi.entityService.delete('api::stem.stem', id);
      return stem;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  // Custom actions
  async incrementPreviewCount(ctx) {
    try {
      const { id } = ctx.params;
      const stem = await strapi.entityService.findOne('api::stem.stem', id);
      const updatedStem = await strapi.entityService.update('api::stem.stem', id, {
        data: {
          previewCount: (stem.previewCount || 0) + 1,
        },
      });
      return updatedStem;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async incrementPurchaseCount(ctx) {
    try {
      const { id } = ctx.params;
      const stem = await strapi.entityService.findOne('api::stem.stem', id);
      const updatedStem = await strapi.entityService.update('api::stem.stem', id, {
        data: {
          purchaseCount: (stem.purchaseCount || 0) + 1,
        },
      });
      return updatedStem;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async bulkCreate(ctx) {
    try {
      const { data } = ctx.request.body;
      const stems = await Promise.all(
        data.map(async (stemData) => {
          return await strapi.entityService.create('api::stem.stem', {
            data: {
              ...stemData,
              publishedAt: new Date(),
            },
          });
        })
      );
      return stems;
    } catch (err) {
      ctx.throw(500, err);
    }
  },
}; 