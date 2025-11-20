import { createJobSchema } from './job-schema';

export const validateCreateJob = (data: unknown): { inputUrl: string } => {
  const { error, value } = createJobSchema.validate(data);

  if (error) {
    throw new Error(error.details[0].message);
  }

  return value;
};
