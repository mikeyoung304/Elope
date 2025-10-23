/**
 * Date utilities
 */
/**
 * Convert a date to UTC midnight in YYYY-MM-DD format
 * @param input - Date string or Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function toUtcMidnight(input) {
    const date = typeof input === 'string' ? new Date(input) : input;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
//# sourceMappingURL=date.js.map