export type ReminderType = 'friday_before' | 'day_before' | 'week_before' | 'month_before' | 'custom'

export function calculateReminderDate(
  eventDate: Date,
  reminderType: ReminderType,
  customDate?: Date
): Date {
  const d = new Date(eventDate)
  switch (reminderType) {
    case 'day_before':
      d.setDate(d.getDate() - 1)
      return d
    case 'week_before':
      d.setDate(d.getDate() - 7)
      return d
    case 'month_before':
      d.setDate(d.getDate() - 30)
      return d
    case 'friday_before':
      d.setDate(d.getDate() - 1)
      while (d.getDay() !== 5) d.setDate(d.getDate() - 1)
      return d
    case 'custom':
      return customDate!
    default:
      return d
  }
}
