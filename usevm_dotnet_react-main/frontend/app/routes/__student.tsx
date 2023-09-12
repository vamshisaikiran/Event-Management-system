import type {LoaderArgs, SerializeFrom} from "@remix-run/node"
import {json, redirect} from "@remix-run/node"
import {Outlet} from "@remix-run/react"
import {LayoutDashboardIcon, TicketIcon} from "lucide-react"
import {Nav, type NavMenuItems} from "~/components/Nav"
import {
	isAdmin,
	isOrganizer,
	isSuperAdmin,
	requireUserId,
} from "~/session.server"

export type StudentLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	await requireUserId(request)

	if (await isAdmin(request)) {
		return redirect("/admin")
	} else if (await isOrganizer(request)) {
		return redirect("/organizer")
	} else if (await isSuperAdmin(request)) {
		return redirect("/super-admin")
	}

	return json({})
}

const navMenu: NavMenuItems = [
	{
		items: [
			{
				name: "Events",
				href: `/`,
				icon: <LayoutDashboardIcon width={18} />,
			},
			{
				name: "My Events",
				href: `/my-events`,
				icon: <TicketIcon width={18} />,
			},
		],
	},
]

export default function AppLayout() {
	return (
		<>
			<div>
				<Nav menuItems={navMenu} />

				<div className="min-h-screen bg-stone-50 sm:pl-64">
					<Outlet />
				</div>
			</div>
		</>
	)
}
