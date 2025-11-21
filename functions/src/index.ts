/**
 * Cloud Function for scheduled job cleanup
 *
 * Deletes jobs older than 30 days from Firestore and optionally archives them to Storage.
 * Triggered by Cloud Scheduler (recommended: daily at 2 AM)
 *
 * Environment Variables:
 * - ARCHIVE_ENABLED: Set to "true" to archive jobs before deletion (default: false)
 * - JOB_RETENTION_DAYS: Number of days to retain jobs (default: 30)
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Type aliases for Firebase Functions request/response
type Request = functions.https.Request;
type Response = functions.Response;

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

interface CleanupStats {
  totalScanned: number;
  totalDeleted: number;
  totalArchived: number;
  errors: number;
  deletedJobs: string[];
}

/**
 * Calculate cutoff date based on retention period
 */
const getCutoffDate = (retentionDays: number): Date => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff;
};

/**
 * Archive a job document to Cloud Storage before deletion
 */
const archiveJob = async (
  jobId: string,
  jobData: admin.firestore.DocumentData
): Promise<boolean> => {
  try {
    const bucket = storage.bucket();
    const archivePath = `archives/jobs/${new Date().getFullYear()}/${jobId}.json`;
    const file = bucket.file(archivePath);

    await file.save(JSON.stringify(jobData, null, 2), {
      contentType: "application/json",
      metadata: {
        archivedAt: new Date().toISOString(),
        originalCreatedAt: jobData.createdAt,
      },
    });

    functions.logger.info(`Archived job ${jobId} to ${archivePath}`);
    return true;
  } catch (error) {
    functions.logger.error(`Failed to archive job ${jobId}:`, error);
    return false;
  }
};

/**
 * Delete processed image from Storage if it exists
 */
const deleteProcessedImage = async (jobId: string): Promise<void> => {
  try {
    const bucket = storage.bucket();
    const imagePath = `processed/${jobId}.jpg`;
    const file = bucket.file(imagePath);

    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      functions.logger.info(`Deleted processed image for job ${jobId}`);
    }
  } catch (error) {
    functions.logger.warn(`Failed to delete image for job ${jobId}:`, error);
    // Don't throw - continue with job deletion even if image deletion fails
  }
};

/**
 * Main cleanup function
 * Scheduled to run daily via Cloud Scheduler
 */
export const cleanupOldJobs = functions
  .region("us-central1") // Change to your preferred region
  .pubsub.schedule("0 2 * * *") // Daily at 2 AM (Cron format)
  .timeZone("America/New_York") // Change to your timezone
  .onRun(async (_context: functions.EventContext) => {
    const startTime = Date.now();
    functions.logger.info("Starting scheduled job cleanup...");

    // Configuration from environment variables
    const archiveEnabled = process.env.ARCHIVE_ENABLED === "true";
    const retentionDays = parseInt(process.env.JOB_RETENTION_DAYS || "30", 10);
    const cutoffDate = getCutoffDate(retentionDays);

    functions.logger.info(`Configuration:`, {
      archiveEnabled,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    });

    const stats: CleanupStats = {
      totalScanned: 0,
      totalDeleted: 0,
      totalArchived: 0,
      errors: 0,
      deletedJobs: [],
    };

    try {
      // Query jobs older than cutoff date
      const oldJobsQuery = db
        .collection("jobs")
        .where("createdAt", "<", cutoffDate.toISOString())
        .limit(500); // Process in batches to avoid timeout

      const snapshot = await oldJobsQuery.get();
      stats.totalScanned = snapshot.size;

      functions.logger.info(
        `Found ${stats.totalScanned} jobs older than ${retentionDays} days`
      );

      if (snapshot.empty) {
        functions.logger.info("No old jobs to clean up");
        return stats;
      }

      // Use batch for efficient deletion
      const batch = db.batch();
      const jobsToDelete: Array<{
        id: string;
        data: admin.firestore.DocumentData;
      }> = [];

      snapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        jobsToDelete.push({
          id: doc.id,
          data: doc.data(),
        });
      });

      // Archive jobs if enabled
      if (archiveEnabled) {
        functions.logger.info("Archiving jobs before deletion...");
        for (const job of jobsToDelete) {
          const archived = await archiveJob(job.id, job.data);
          if (archived) {
            stats.totalArchived++;
          } else {
            stats.errors++;
          }
        }
      }

      // Delete processed images and job documents
      for (const job of jobsToDelete) {
        try {
          // Delete processed image from Storage
          await deleteProcessedImage(job.id);

          // Add job document deletion to batch
          batch.delete(db.collection("jobs").doc(job.id));
          stats.deletedJobs.push(job.id);
        } catch (error) {
          functions.logger.error(`Error processing job ${job.id}:`, error);
          stats.errors++;
        }
      }

      // Commit batch deletion
      await batch.commit();
      stats.totalDeleted = stats.deletedJobs.length;

      const duration = Date.now() - startTime;
      functions.logger.info("Job cleanup completed", {
        ...stats,
        durationMs: duration,
      });

      return stats;
    } catch (error) {
      functions.logger.error("Job cleanup failed:", error);
      throw error;
    }
  });

/**
 * Manual cleanup function (can be called via HTTP for testing)
 * Remove or secure this in production
 */
export const manualCleanup = functions
  .region("us-central1")
  .https.onRequest(async (req: Request, res: Response) => {
    // Simple API key authentication (use Firebase Auth in production)
    const apiKey = req.get("X-API-Key");
    const expectedKey = process.env.CLEANUP_API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    try {
      functions.logger.info("Manual cleanup triggered");

      const retentionDays = parseInt((req.query.days as string) || "30", 10);
      const archiveEnabled = req.query.archive === "true";

      // Temporarily set env vars for this execution
      const originalArchive = process.env.ARCHIVE_ENABLED;
      const originalRetention = process.env.JOB_RETENTION_DAYS;

      process.env.ARCHIVE_ENABLED = archiveEnabled.toString();
      process.env.JOB_RETENTION_DAYS = retentionDays.toString();

      // Call the main cleanup logic
      const cutoffDate = getCutoffDate(retentionDays);
      const stats: CleanupStats = {
        totalScanned: 0,
        totalDeleted: 0,
        totalArchived: 0,
        errors: 0,
        deletedJobs: [],
      };

      const oldJobsQuery = db
        .collection("jobs")
        .where("createdAt", "<", cutoffDate.toISOString())
        .limit(500);

      const snapshot = await oldJobsQuery.get();
      stats.totalScanned = snapshot.size;

      if (!snapshot.empty) {
        const batch = db.batch();

        for (const doc of snapshot.docs) {
          if (archiveEnabled) {
            const archived = await archiveJob(doc.id, doc.data());
            if (archived) stats.totalArchived++;
          }

          await deleteProcessedImage(doc.id);
          batch.delete(doc.ref);
          stats.deletedJobs.push(doc.id);
        }

        await batch.commit();
        stats.totalDeleted = stats.deletedJobs.length;
      }

      // Restore env vars
      process.env.ARCHIVE_ENABLED = originalArchive;
      process.env.JOB_RETENTION_DAYS = originalRetention;

      res.status(200).json({
        success: true,
        message: "Manual cleanup completed",
        stats,
      });
    } catch (error) {
      functions.logger.error("Manual cleanup failed:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
