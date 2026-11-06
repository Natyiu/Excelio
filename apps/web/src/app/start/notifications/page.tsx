import { Mascot } from "@/components/mascot";
import { Panel, pressable } from "@/components/game-ui";

export default function GuestNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Replies, updates and reminders to keep your streak going.</p>
      </div>
      <Panel className="flex flex-col items-center p-8 text-center">
        <Mascot mood="wave" size={110} />
        <p className="mt-4 text-lg font-bold">Nothing here yet</p>
        <p className="mt-1 text-[15px] text-muted-foreground">Your notifications will show up here once you have an account.</p>
        <button type="button" className={pressable("brand", "mt-5 px-6")}>
          Turn on notifications
        </button>
      </Panel>
    </div>
  );
}
