-- Add unique constraint for TIMESLOT bookings to prevent double-booking
-- This constraint ensures only one booking can exist for a given tenant + service + start time

-- Create unique index for TIMESLOT double-booking prevention
-- Only applies when startTime is NOT NULL (i.e., TIMESLOT bookings)
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_timeslot_unique"
ON "Booking"("tenantId", "serviceId", "startTime")
WHERE "startTime" IS NOT NULL AND "serviceId" IS NOT NULL;

-- Add composite index for efficient overlap detection in slot availability queries
CREATE INDEX IF NOT EXISTS "Booking_tenantId_serviceId_startTime_endTime_idx"
ON "Booking"("tenantId", "serviceId", "startTime", "endTime")
WHERE "bookingType" = 'TIMESLOT';
