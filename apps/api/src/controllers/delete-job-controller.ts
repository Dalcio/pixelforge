import { Request, Response } from "express";
import { getFirestore } from "../lib/firestore-client";
import * as admin from "firebase-admin";

export const deleteJobController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Job ID is required" });
      return;
    }

    const db = getFirestore();
    const jobRef = db.collection("jobs").doc(id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const jobData = jobDoc.data();

    if (jobData?.outputUrl) {
      try {
        const bucket = admin.storage().bucket();

        const url = jobData.outputUrl;
        let filePath: string | null = null;

        if (url.startsWith("gs://")) {
          filePath = url.split("/").slice(3).join("/");
        } else if (url.includes("storage.googleapis.com")) {
          const pathMatch = url.match(/\/o\/(.+?)(\?|$)/);
          if (pathMatch) {
            filePath = decodeURIComponent(pathMatch[1]);
          }
        } else if (url.includes("firebasestorage.googleapis.com")) {
          const pathMatch = url.match(/\/o\/(.+?)(\?|$)/);
          if (pathMatch) {
            filePath = decodeURIComponent(pathMatch[1]);
          }
        }

        if (filePath) {
          const file = bucket.file(filePath);
          const [exists] = await file.exists();

          if (exists) {
            await file.delete();
          }
        }
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        process.stderr.write(
          `[API] Failed to delete processed image for job ${id}: ${errorMsg}\n`
        );
      }
    }

    await jobRef.delete();

    res.status(200).json({
      success: true,
      message: "Job and associated files deleted successfully",
      id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`[API] Error deleting job: ${errorMessage}\n`);
    res.status(500).json({
      error: "Failed to delete job",
      message: errorMessage,
    });
  }
};
