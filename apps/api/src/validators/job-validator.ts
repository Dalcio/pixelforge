import { createJobSchema } from "./job-schema";
import type { TransformationOptions } from "@fluximage/types";

export interface ValidatedCreateJobInput {
  inputUrl: string;
  transformations?: TransformationOptions;
}

export const validateCreateJob = (data: unknown): ValidatedCreateJobInput => {
  const { error, value } = createJobSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(error.details[0].message);
  }

  return {
    inputUrl: value.inputUrl,
    transformations: value.transformations,
  };
};
