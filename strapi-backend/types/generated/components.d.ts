import type { Schema, Struct } from '@strapi/strapi';

export interface TrackTrackStem extends Struct.ComponentSchema {
  collectionName: 'components_track_track_stems';
  info: {
    displayName: 'track.stem';
  };
  attributes: {
    duration: Schema.Attribute.Decimal;
    mp3Url: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    price: Schema.Attribute.Decimal;
    waveform: Schema.Attribute.JSON;
    wavUrl: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'track.track-stem': TrackTrackStem;
    }
  }
}
