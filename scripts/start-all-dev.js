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
      retryStrategy: () => null,
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
      const redisDir = path.join(__dirname, "..", "redis");
      const psCommand = `Start-Process cmd -ArgumentList '/k', 'cd /d ${redisDir} && redis-server.exe' -WindowStyle Normal`;
      command = `powershell -Command "${psCommand}"`;
    } else if (isMac || isLinux) {
      // Check if redis-server is installed
      exec("which redis-server", (error) => {
        if (error) {
          console.error("✗ Redis is not installed on this system");
          console.error("\nPlease install Redis:");
          if (isMac) {
            console.error("  brew install redis");
          } else {
            console.error(
              "  sudo apt-get install redis-server  # Ubuntu/Debian"
            );
            console.error("  sudo yum install redis            # CentOS/RHEL");
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

// Start all services
function startAllServices() {
  console.log("\nStarting all services...\n");

  const services = [
    { name: "API", filter: "@fluximage/api", color: "\x1b[36m" },
    { name: "Worker", filter: "@fluximage/worker", color: "\x1b[33m" },
    { name: "Web", filter: "@fluximage/web", color: "\x1b[35m" },
  ];

  const processes = services.map(({ name, filter, color }) => {
    console.log(`${color}Starting ${name}...\x1b[0m`);

    const proc = spawn("pnpm", ["--filter", filter, "dev"], {
      stdio: "inherit",
      shell: true,
    });

    proc.on("error", (err) => {
      console.error(`Failed to start ${name}:`, err);
    });

    return { name, proc };
  });

  // Handle termination
  process.on("SIGINT", () => {
    console.log("\n\nShutting down all services...");
    processes.forEach(({ name, proc }) => {
      console.log(`Stopping ${name}...`);
      proc.kill("SIGINT");
    });
    process.exit(0);
  });
}

// Main execution
async function main() {
  console.log("=".repeat(60));
  console.log("  PixelForge Development Environment");
  console.log("=".repeat(60));
  console.log("");

  try {
    // Ensure Redis is running
    const redisRunning = await checkRedis();

    if (!redisRunning) {
      await startRedis();
    }

    console.log("");
    console.log("Starting services:");
    console.log("  • API:    http://localhost:3000");
    console.log("  • Web:    http://localhost:5174");
    console.log("  • Worker: Processing jobs in background");
    console.log("");
    console.log("Press Ctrl+C to stop all services");
    console.log("=".repeat(60));

    startAllServices();
  } catch (error) {
    console.error("Error:", error.message);
    console.error("\nPlease start Redis manually:");
    if (isWindows) {
      console.error("  cd redis");
      console.error("  redis-server.exe");
    } else {
      console.error("  redis-server");
    }
    process.exit(1);
  }
}

main();
