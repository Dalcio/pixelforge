import { Request, Response } from "express";
import { getQueue } from "../lib/queue-client";
import { getFirestore } from "../lib/firestore-client";
import { FieldValue } from "firebase-admin/firestore";

export const retryJobController = async (
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

    if (jobData?.status !== "failed") {
      res.status(400).json({
        error: "Only failed jobs can be retried",
        currentStatus: jobData?.status,
      });
      return;
    }

    await jobRef.update({
      status: "pending",
      progress: 0,
      error: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const queue = getQueue();
    await queue.add(
      "process-image",
      {
        jobId: id,
        inputUrl: jobData.inputUrl,
        transformations: jobData.transformations || {},
      },
      {
        jobId: id,
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    const updatedJobDoc = await jobRef.get();
    const updatedData = updatedJobDoc.data();

    res.status(200).json({
      id: updatedJobDoc.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate().toISOString(),
      processedAt: updatedData?.processedAt?.toDate().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`[API] Error retrying job: ${errorMessage}\n`);
    res.status(500).json({
      error: "Failed to retry job",
      message: errorMessage,
    });
  }
};
