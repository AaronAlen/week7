export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    req.validatedBody = result.data;
    next();
  } catch (err) {
    next(err);
  }
};
