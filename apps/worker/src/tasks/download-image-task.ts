import axios from 'axios';

export const downloadImage = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  return Buffer.from(response.data);
};
