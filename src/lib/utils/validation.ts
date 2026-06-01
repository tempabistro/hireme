/**
 * Validation utilities for ApplyPilot AI.
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate candidate profile required fields.
 */
export function validateProfile(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim().length === 0) {
    errors.push({ field: 'full_name', message: 'Full name is required.' });
  }

  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    errors.push({ field: 'email', message: 'A valid email address is required.' });
  }

  return errors;
}

/**
 * Validate country preference data.
 */
export function validateCountryPreference(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.country_name || typeof data.country_name !== 'string') {
    errors.push({ field: 'country_name', message: 'Country name is required.' });
  }

  if (!data.country_code || typeof data.country_code !== 'string') {
    errors.push({ field: 'country_code', message: 'Country code is required.' });
  }

  if (data.minimum_salary !== undefined && data.minimum_salary !== null) {
    const salary = Number(data.minimum_salary);
    if (isNaN(salary) || salary < 0) {
      errors.push({ field: 'minimum_salary', message: 'Minimum salary must be a positive number.' });
    }
  }

  return errors;
}

/**
 * Validate job import data.
 */
export function validateJobImport(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  const hasDescription = data.raw_description && typeof data.raw_description === 'string' && (data.raw_description as string).trim().length > 0;
  const hasUrl = data.source_url && typeof data.source_url === 'string' && (data.source_url as string).trim().length > 0;
  const hasTitle = data.title && typeof data.title === 'string' && (data.title as string).trim().length > 0;

  if (!hasDescription && !hasUrl && !hasTitle) {
    errors.push({
      field: 'raw_description',
      message: 'Please provide a job description, URL, or at least a job title.',
    });
  }

  return errors;
}

/**
 * Validate salary against minimum threshold.
 */
export function validateSalary(
  jobSalaryMin: number | null,
  jobSalaryMax: number | null,
  minimumSalary: number | null,
  jobCurrency: string | null,
  expectedCurrency: string
): { valid: boolean; reason: string } {
  if (minimumSalary === null || minimumSalary === 0) {
    return { valid: true, reason: 'No minimum salary set.' };
  }

  if (jobSalaryMin === null && jobSalaryMax === null) {
    return { valid: true, reason: 'Job salary not specified — cannot validate.' };
  }

  // Currency mismatch warning
  if (jobCurrency && jobCurrency.toUpperCase() !== expectedCurrency.toUpperCase()) {
    return {
      valid: true,
      reason: `Salary currency mismatch: job uses ${jobCurrency}, you expected ${expectedCurrency}. Manual review recommended.`,
    };
  }

  const jobMax = jobSalaryMax || jobSalaryMin || 0;
  if (jobMax < minimumSalary) {
    return {
      valid: false,
      reason: `Job salary (${jobMax.toLocaleString()}) is below your minimum (${minimumSalary.toLocaleString()}).`,
    };
  }

  return { valid: true, reason: 'Salary meets minimum threshold.' };
}
