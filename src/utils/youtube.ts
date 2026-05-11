// YouTube URL 工具函式

export const getYouTubeID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeID(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
};

export const getVideoUrl = (item) => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.url;
};

export const getVideoTitle = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.title && item.title.trim() !== '' ? item.title : item.url;
};
