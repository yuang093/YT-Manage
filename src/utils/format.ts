// 格式化工具函式

export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
};

export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
};
