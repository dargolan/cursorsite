const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'd1r94114aksajj.cloudfront.net';
const S3_DOMAIN = process.env.NEXT_PUBLIC_S3_DOMAIN || 'wave-cave-audio.s3.amazonaws.com';

function getCdnDomain() {
  return CDN_DOMAIN;
}

function getS3Domain() {
  return S3_DOMAIN;
}

function isCdnUrl(url) {
  if (!url) return false;
  return url.includes(CDN_DOMAIN);
}

function toCdnUrl(url) {
  if (!url) return '';
  if (isCdnUrl(url)) return url;
  if (url.includes(S3_DOMAIN)) {
    return url.replace(S3_DOMAIN, CDN_DOMAIN);
  }
  return url;
}

module.exports = {
  getCdnDomain,
  getS3Domain,
  isCdnUrl,
  toCdnUrl
}; 