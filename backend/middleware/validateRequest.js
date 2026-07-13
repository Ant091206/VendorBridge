/**
 * Request Validation Middleware
 * A reusable validator for POST/PUT routes.
 *
 * Usage:
 *   import { validate, rules } from '../middleware/validateRequest.js';
 *
 *   router.post('/vendors', verifyToken,
 *     validate([
 *       rules.required('name'),
 *       rules.required('email'),
 *       rules.email('email'),
 *       rules.minLength('name', 2),
 *     ]),
 *     createVendor
 *   );
 */

// ── Predefined validation rule builders ──
export const rules = {
  /**
   * Field must exist and not be blank.
   */
  required: (field) => ({
    field,
    test: (val) => val !== undefined && val !== null && String(val).trim() !== '',
    message: `${field} is required.`
  }),

  /**
   * Field must match basic email pattern.
   */
  email: (field) => ({
    field,
    test: (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val)),
    message: `${field} must be a valid email address.`
  }),

  /**
   * Field value must be at least `min` characters.
   */
  minLength: (field, min) => ({
    field,
    test: (val) => !val || String(val).trim().length >= min,
    message: `${field} must be at least ${min} characters long.`
  }),

  /**
   * Field value must be a positive number.
   */
  positiveNumber: (field) => ({
    field,
    test: (val) => val === undefined || val === '' || (Number(val) > 0 && !isNaN(Number(val))),
    message: `${field} must be a positive number.`
  }),

  /**
   * Field value must be one of the allowed values.
   */
  oneOf: (field, allowed) => ({
    field,
    test: (val) => !val || allowed.includes(val),
    message: `${field} must be one of: ${allowed.join(', ')}.`
  }),

  /**
   * Password must meet strong criteria:
   *   - At least 8 characters
   *   - At least 1 uppercase letter
   *   - At least 1 lowercase letter
   *   - At least 1 number
   */
  strongPassword: (field = 'password') => ({
    field,
    test: (val) => {
      if (!val) return true; // let required() handle empty check
      const s = String(val);
      return (
        s.length >= 8 &&
        /[A-Z]/.test(s) &&
        /[a-z]/.test(s) &&
        /[0-9]/.test(s)
      );
    },
    message: `${field} must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.`
  }),

  /**
   * Optional phone number field.
   * Accepts formats: +91XXXXXXXXXX, 9876543210, +1-800-555-0100, etc.
   * Allows empty/null (optional).
   */
  phone: (field = 'phone') => ({
    field,
    test: (val) => {
      if (!val || String(val).trim() === '') return true; // optional
      return /^\+?[\d\s\-().]{7,20}$/.test(String(val).trim());
    },
    message: `${field} must be a valid phone number (7–20 digits, may include +, spaces, hyphens).`
  })
};

/**
 * Middleware factory: takes an array of rule objects and validates req.body.
 * Returns 400 with structured errors if validation fails.
 *
 * @param {Array} validationRules - Array of rule objects {field, test, message}
 */
export const validate = (validationRules) => {
  return (req, res, next) => {
    const errors = [];

    for (const rule of validationRules) {
      const fieldValue = req.body[rule.field];
      const isValid = rule.test(fieldValue);
      if (!isValid) {
        errors.push({ field: rule.field, message: rule.message });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the following errors.',
        errors
      });
    }

    next();
  };
};
