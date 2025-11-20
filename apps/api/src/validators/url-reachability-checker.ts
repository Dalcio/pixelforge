import https from 'https';
import http from 'http';

export const checkUrlReachability = async (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode < 400);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};
