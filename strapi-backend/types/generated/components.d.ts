import type { Schema, Struct } from '@strapi/strapi';

export interface MusicStem extends Struct.ComponentSchema {
  collectionName: 'components_music_stems';
  info: {
    displayName: 'Stem';
  };
  attributes: {
    Audio: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'> &
      Schema.Attribute.Required;
    Name: Schema.Attribute.String & Schema.Attribute.Required;
    Price: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'music.stem': MusicStem;
    }
  }
}
