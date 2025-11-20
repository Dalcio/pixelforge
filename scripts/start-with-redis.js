const { spawn, exec } = require("child_process");
const { platform } = require("os");
const path = require("path");

const isWindows = platform() === "win32";
const isMac = platform() === "darwin";
const isLinux = platform() === "linux";

// Check if Redis is running
function checkRedis() {
  return new Promise((resolve) => {
    const Redis = require("ioredis");
    const redis = new Redis({
      host: "localhost",
      port: 6379,
      retryStrategy: () => null, // Don't retry
      lazyConnect: true,
    });

    redis
      .connect()
      .then(() => {
        console.log("✓ Redis is already running");
        redis.disconnect();
        resolve(true);
      })
      .catch(() => {
        console.log("✗ Redis is not running");
        resolve(false);
      });
  });
}

// Start Redis server
function startRedis() {
  return new Promise((resolve, reject) => {
    console.log("Starting Redis server...");

    let command;

    if (isWindows) {
      // Windows: Start Redis using PowerShell
      const redisDir = path.join(__dirname, "..", "redis");
      const psCommand = `Start-Process cmd -ArgumentList '/k', 'cd /d ${redisDir} && redis-server.exe' -WindowStyle Normal`;
      command = `powershell -Command "${psCommand}"`;
    } else if (isMac || isLinux) {
      // macOS/Linux: Start Redis in background
      // First check if redis-server is installed
      exec("which redis-server", (error) => {
        if (error) {
          console.error("✗ Redis is not installed on this system");
          console.error("\nPlease install Redis:");
          if (isMac) {
            console.error("  brew install redis");
            console.error("Or download from: https://redis.io/download");
          } else {
            console.error(
              "  sudo apt-get install redis-server  # Ubuntu/Debian"
            );
            console.error("  sudo yum install redis            # CentOS/RHEL");
            console.error("Or download from: https://redis.io/download");
          }
          reject(new Error("Redis not installed"));
          return;
        }

        // Start Redis as daemon
        exec("redis-server --daemonize yes", (error) => {
          if (error) {
            console.error("Failed to start Redis:", error.message);
            reject(error);
            return;
          }

          waitForRedis(resolve, reject);
        });
      });
      return;
    } else {
      reject(new Error(`Unsupported platform: ${platform()}`));
      return;
    }

    // Execute Windows command
    exec(command, (error) => {
      if (error) {
        console.error("Failed to start Redis:", error.message);
        reject(error);
        return;
      }

      waitForRedis(resolve, reject);
    });
  });
}

// Wait for Redis to be ready
function waitForRedis(resolve, reject) {
  console.log("Waiting for Redis to initialize...");
  let attempts = 0;
  const maxAttempts = 10;

  const checkInterval = setInterval(async () => {
    attempts++;
    const running = await checkRedis();

    if (running) {
      clearInterval(checkInterval);
      console.log("✓ Redis started successfully");
      resolve();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      reject(new Error("Redis failed to start after multiple attempts"));
    }
  }, 1000);
}

// Start the service (API or Worker)
function startService(serviceName) {
  const service =
    serviceName === "api" ? "@fluximage/api" : "@fluximage/worker";
  console.log(`\nStarting ${serviceName}...`);

  const serviceProcess = spawn("pnpm", ["--filter", service, "dev"], {
    stdio: "inherit",
    shell: true,
  });

  serviceProcess.on("error", (err) => {
    console.error(`Failed to start ${serviceName}:`, err);
    process.exit(1);
  });

  serviceProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error(`${serviceName} exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle termination
  process.on("SIGINT", () => {
    console.log(`\nShutting down ${serviceName}...`);
    serviceProcess.kill("SIGINT");
    process.exit(0);
  });
}

// Main execution
async function main() {
  const serviceName = process.argv[2] || "worker";

  console.log("=".repeat(50));
  console.log(`Starting ${serviceName.toUpperCase()} with Redis`);
  console.log("=".repeat(50));

  try {
    const redisRunning = await checkRedis();

    if (!redisRunning) {
      await startRedis();
    }

    startService(serviceName);
  } catch (error) {
    console.error("Error:", error.message);
    console.error("\nPlease start Redis manually:");
    if (isWindows) {
      console.error("  cd redis");
      console.error("  redis-server.exe");
    } else {
      console.error("  redis-server");
      console.error("Or install Redis if not available.");
    }
    process.exit(1);
  }
}

main();
