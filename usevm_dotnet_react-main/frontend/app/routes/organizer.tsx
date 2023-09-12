import type {LoaderArgs, SerializeFrom} from "@remix-run/node"
import {json, redirect} from "@remix-run/node"
import {Outlet} from "@remix-run/react"
import {LayoutDashboardIcon} from "lucide-react"
import type {NavMenuItems} from "~/components/Nav"
import {Nav} from "~/components/Nav"
import {isAdmin, isStudent, isSuperAdmin, requireUserId} from "~/session.server"

export const ROUTE = "/organizer"

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	await requireUserId(request)

	if (await isStudent(request)) {
		return redirect("/student")
	} else if (await isSuperAdmin(request)) {
		return redirect("/super-admin")
	} else if (await isAdmin(request)) {
		return redirect("/admin")
	}

	return json({})
}

const navMenu: NavMenuItems = [
	{
		title: "Manage",
		items: [
			{
				name: "Events",
				href: `${ROUTE}`,
				icon: <LayoutDashboardIcon width={18} />,
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
