import https from "https";
import http from "http";

export interface ReachabilityResult {
  reachable: boolean;
  reason?: string;
  statusCode?: number;
}

export const checkUrlReachability = async (
  url: string
): Promise<ReachabilityResult> => {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.request(
      url,
      { method: "HEAD", timeout: 5000 },
      (res) => {
        const statusCode = res.statusCode;

        if (!statusCode) {
          resolve({
            reachable: false,
            reason: "No response received from server",
          });
          return;
        }

        if (statusCode === 404) {
          resolve({
            reachable: false,
            reason: "Resource not found (HTTP 404)",
            statusCode: 404,
          });
          return;
        }

        if (statusCode >= 400) {
          resolve({
            reachable: false,
            reason: `Server returned error status: ${statusCode}`,
            statusCode,
          });
          return;
        }

        const contentType = res.headers
          ? res.headers["content-type"]
          : undefined;
        if (contentType && !contentType.startsWith("image/")) {
          resolve({
            reachable: false,
            reason: `Invalid content type: ${contentType}. Expected image/* type.`,
            statusCode,
          });
          return;
        }

        resolve({
          reachable: true,
          statusCode,
        });
      }
    );

    req.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOTFOUND") {
        resolve({
          reachable: false,
          reason: "Domain not found or DNS lookup failed",
        });
      } else if (error.code === "ECONNREFUSED") {
        resolve({
          reachable: false,
          reason: "Connection refused by server",
        });
      } else if (
        error.code === "ETIMEDOUT" ||
        error.code === "ESOCKETTIMEDOUT"
      ) {
        resolve({
          reachable: false,
          reason: "Connection timed out",
        });
      } else if (error.code === "ECONNRESET") {
        resolve({
          reachable: false,
          reason: "Connection reset by server",
        });
      } else {
        resolve({
          reachable: false,
          reason: `Network error: ${error.message}`,
        });
      }
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        reachable: false,
        reason: "Request timed out after 5 seconds",
      });
    });

    req.end();
  });
};
