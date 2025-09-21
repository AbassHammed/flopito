import BigCalendar from '~/big-calendar'

export default function SchedulePage() {
  return (
    <main className="bg-background relative flex flex-1 flex-col rounded-md m-2">
      <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
        <BigCalendar />
      </div>
    </main>
  )
}
