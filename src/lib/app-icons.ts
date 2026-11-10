import {
	CalendarCheck,
	CalendarClock,
	Coffee,
	ConciergeBell,
	LayoutDashboard,
	MessagesSquare,
	Presentation,
	SlidersHorizontal,
	TabletSmartphone,
	UsersRound,
	type LucideIcon
} from '@lucide/svelte';
import type { AppKind } from './client-schema.ts';

/** The Lucide icon for each kind of demo app. */
export const APP_ICONS: Record<AppKind, LucideIcon> = {
	backoffice: LayoutDashboard,
	bookings: CalendarCheck,
	catering: Coffee,
	concierge: ConciergeBell,
	control: SlidersHorizontal,
	kiosk: TabletSmartphone,
	room: Presentation,
	social: MessagesSquare,
	staff: UsersRound,
	timetable: CalendarClock
};
