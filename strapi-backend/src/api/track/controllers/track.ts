/**
 * track controller
 */

import { Strapi } from '@strapi/strapi'

export default {
  async find(ctx) {
    try {
      const { query } = ctx;
      const tracks = await strapi.entityService.findMany('api::track.track', {
        ...query,
        populate: ['tags', 'stems'],
      });
      return tracks;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const track = await strapi.entityService.findOne('api::track.track', id, {
        populate: ['tags', 'stems'],
      });
      return track;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async create(ctx) {
    try {
      const { data } = ctx.request.body;
      const track = await strapi.entityService.create('api::track.track', {
        data: {
          ...data,
          publishedAt: new Date(),
        },
        populate: ['tags', 'stems'],
      });
      return track;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      const track = await strapi.entityService.update('api::track.track', id, {
        data,
        populate: ['tags', 'stems'],
      });
      return track;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const track = await strapi.entityService.delete('api::track.track', id);
      return track;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  // Custom actions
  async incrementPlayCount(ctx) {
    try {
      const { id } = ctx.params;
      const track = await strapi.entityService.findOne('api::track.track', id);
      const updatedTrack = await strapi.entityService.update('api::track.track', id, {
        data: {
          playCount: (track.playCount || 0) + 1,
        },
      });
      return updatedTrack;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async incrementDownloadCount(ctx) {
    try {
      const { id } = ctx.params;
      const track = await strapi.entityService.findOne('api::track.track', id);
      const updatedTrack = await strapi.entityService.update('api::track.track', id, {
        data: {
          downloadCount: (track.downloadCount || 0) + 1,
        },
      });
      return updatedTrack;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async bulkCreate(ctx) {
    try {
      const { data } = ctx.request.body;
      const tracks = await Promise.all(
        data.map(async (trackData) => {
          return await strapi.entityService.create('api::track.track', {
            data: {
              ...trackData,
              publishedAt: new Date(),
            },
          });
        })
      );
      return tracks;
    } catch (err) {
      ctx.throw(500, err);
    }
  },
};
