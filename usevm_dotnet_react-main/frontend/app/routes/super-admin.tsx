import {ArrowLeftOnRectangleIcon} from "@heroicons/react/24/solid"

import {Anchor, Avatar, Divider, Menu, ScrollArea} from "@mantine/core"
import type {LoaderArgs, SerializeFrom} from "@remix-run/node"
import {json, redirect} from "@remix-run/node"
import {Form, Link, Outlet} from "@remix-run/react"
import appConfig from "app.config"
import {Footer} from "~/components/Footer"
import {TailwindContainer} from "~/components/TailwindContainer"
import {isAdmin, isOrganizer, isStudent, requireUserId} from "~/session.server"
import {useUser} from "~/utils/hooks"

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	await requireUserId(request)

	if (await isStudent(request)) {
		return redirect("/student")
	} else if (await isOrganizer(request)) {
		return redirect("/organizer")
	} else if (await isAdmin(request)) {
		return redirect("/admin")
	}

	return json({})
}

export default function AppLayout() {
	return (
		<>
			<div className="flex h-full flex-col">
				<HeaderComponent />
				<ScrollArea classNames={{root: "flex-1 bg-gray-100"}}>
					<Content />
				</ScrollArea>
				<Footer />
			</div>
		</>
	)
}

function HeaderComponent() {
	const user = useUser()

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<header className="h-[100px] p-4">
				<TailwindContainer>
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							<Anchor component={Link} to="/">
								<img
									className="h-16 object-cover object-center"
									src={appConfig.logo}
									alt="Logo"
								/>
							</Anchor>
						</div>

						<div className="flex items-center gap-4">
							<Menu position="bottom-start" withArrow>
								<Menu.Target>
									<button>
										{user ? (
											<Avatar color="blue" size="md">
												{user.name.charAt(0)}
											</Avatar>
										) : (
											<Avatar />
										)}
									</button>
								</Menu.Target>

								<Menu.Dropdown>
									<Menu.Item disabled>
										<div className="flex flex-col">
											<p>{user.name}</p>
											<p className="mt-0.5 text-sm">{user.email}</p>
										</div>
									</Menu.Item>
									<Divider />

									<Menu.Item
										icon={<ArrowLeftOnRectangleIcon className="h-4 w-4" />}
										type="submit"
										form="logout-form"
									>
										Logout
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</div>
					</div>
				</TailwindContainer>
			</header>
		</>
	)
}

function Content() {
	return (
		<main>
			<Outlet />
		</main>
	)
}
