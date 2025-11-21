import Joi from "joi";

const transformationSchema = Joi.object({
  width: Joi.number().integer().min(1).max(4000).optional(),
  height: Joi.number().integer().min(1).max(4000).optional(),
  grayscale: Joi.boolean().optional(),
  blur: Joi.number().min(0).max(10).optional(),
  sharpen: Joi.boolean().optional(),
  rotate: Joi.number().valid(0, 90, 180, 270).optional(),
  flip: Joi.boolean().optional(),
  flop: Joi.boolean().optional(),
  quality: Joi.number().integer().min(1).max(100).optional(),
})
  .min(1)
  .optional()
  .messages({
    "object.min":
      "At least one transformation property is required (width, height, grayscale, blur, sharpen, rotate, flip, flop, or quality)",
  });

export const createJobSchema = Joi.object({
  inputUrl: Joi.string().uri().required(),
  transformations: transformationSchema,
});
