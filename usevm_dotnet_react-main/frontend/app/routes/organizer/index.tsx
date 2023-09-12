import {PlusIcon} from "@heroicons/react/24/solid"
import {Button, Select, TextInput, Textarea, Tooltip, clsx} from "@mantine/core"
import type {DateValue} from "@mantine/dates"
import {DateTimePicker} from "@mantine/dates"
import {useDisclosure} from "@mantine/hooks"
import type {ActionFunction, LoaderArgs} from "@remix-run/node"
import {json} from "@remix-run/node"
import {useFetcher, useLoaderData} from "@remix-run/react"
import * as React from "react"
import {z} from "zod"
import {TailwindContainer} from "~/components/TailwindContainer"
import {CustomDrawer} from "~/components/ui/CustomDrawer"
import {PageHeading} from "~/components/ui/PageHeading"
import {
	createEvent,
	getEventsByOrganizerId,
	updateEvent,
} from "~/lib/event.server"
import {getAllSports} from "~/lib/sport.server"
import {getAllStadiums} from "~/lib/stadium.server"
import {getAllTeams} from "~/lib/team.server"
import type {Event} from "~/lib/zodios/event-api"
import type {Sport} from "~/lib/zodios/sport-api"
import type {Team} from "~/lib/zodios/team-api"
import {requireUserId} from "~/session.server"
import {formatDateTime} from "~/utils/misc"
import {badRequest} from "~/utils/misc.server"
import type {inferErrors} from "~/utils/validation"
import {validateAction} from "~/utils/validation"

enum MODE {
	edit,
	add,
}

const ManageEventSchema = z.object({
	eventId: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	description: z.string().min(1, "Description is required"),
	sportId: z.string().min(1, "Sport is required"),
	teamOneId: z.string().min(1, "Team is required"),
	teamTwoId: z.string().min(1, "Team is required"),
	startDateTime: z.string().min(1, "Start date is required"),
	endDateTime: z.string().min(1, "End date is required"),
	stadiumId: z.string().min(1, "Stadium is required"),
})

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageEventSchema>
}

export const loader = async ({request}: LoaderArgs) => {
	const organizerId = await requireUserId(request)

	const [eventsResponse, stadiumsResponse, teamsResponse, sportsResponse] =
		await Promise.all([
			getEventsByOrganizerId(organizerId),
			getAllStadiums(),
			getAllTeams(),
			getAllSports(),
		])

	const events = eventsResponse.success ? eventsResponse.data ?? [] : []
	const stadiums = stadiumsResponse.success ? stadiumsResponse.data ?? [] : []
	const teams = teamsResponse.success ? teamsResponse.data ?? [] : []
	const sports = sportsResponse.success ? sportsResponse.data ?? [] : []

	return json({
		events,
		stadiums,
		teams,
		sports,
	})
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(request, ManageEventSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	console.log(fields)

	const {eventId, ...rest} = fields
	if (eventId) {
		await updateEvent(eventId, rest)
		return json({success: true})
	}

	await createEvent({
		...rest,
		organizerId: await requireUserId(request),
	})

	return json({success: true})
}

export default function ManageEvents() {
	const fetcher = useFetcher<ActionData>()
	const {events, sports, stadiums, teams} = useLoaderData<typeof loader>()

	const [selectedEventId, setSelectedEventId] = React.useState<
		Event["id"] | null
	>(null)
	const [selectedEvent, setSelectedEvent] = React.useState<
		(typeof events)[number] | null
	>(null)

	const [selectedSportId, setSelectedSportId] = React.useState<
		Sport["id"] | null
	>(null)
	const [selectedTeamOneId, setSelectedTeamOneId] = React.useState<
		Team["id"] | null
	>(null)
	const [selectedTeamTwoId, setSelectedTeamTwoId] = React.useState<
		Team["id"] | null
	>(null)
	const [selectedStartDateTime, setSelectedStartDateTime] = React.useState<
		DateValue | undefined
	>(undefined)
	const [selectedEndDateTime, setSelectedEndDateTime] = React.useState<
		DateValue | undefined
	>(undefined)

	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== "idle"

	React.useEffect(() => {
		if (fetcher.state !== "idle" && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedEventId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	React.useEffect(() => {
		if (!selectedEventId) {
			setSelectedEvent(null)
			setSelectedSportId(null)
			setSelectedTeamOneId(null)
			setSelectedTeamTwoId(null)
			setSelectedStartDateTime(null)
			setSelectedEndDateTime(null)
			return
		}

		const event = events.find((event) => event.id === selectedEventId)
		if (!event) return

		setSelectedEvent(event)
		setSelectedSportId(event.sport.id)
		setSelectedTeamOneId(event.teamOne.id)
		setSelectedTeamTwoId(event.teamTwo.id)
		setSelectedStartDateTime(
			event.startDateTime ? new Date(event.startDateTime) : undefined
		)
		setSelectedEndDateTime(
			event.endDateTime ? new Date(event.endDateTime) : undefined
		)

		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [events, selectedEventId])

	React.useEffect(() => {
		if (!selectedStartDateTime) return

		if (!selectedEndDateTime) {
			setSelectedEndDateTime(
				new Date(selectedStartDateTime.getTime() + 60 * 60 * 1000)
			)
			return
		}

		if (selectedStartDateTime.getTime() > selectedEndDateTime.getTime()) {
			setSelectedEndDateTime(
				new Date(selectedStartDateTime.getTime() + 60 * 60 * 1000)
			)
		}
	}, [selectedEndDateTime, selectedStartDateTime])

	return (
		<>
			<TailwindContainer className="rounded-md bg-white">
				<div className="px-4 py-10 sm:px-6 lg:px-8">
					<PageHeading
						title="Manage Events"
						rightSection={
							<Button
								loading={isSubmitting}
								loaderPosition="left"
								onClick={() => {
									setMode(MODE.add)
									handleModal.open()
								}}
							>
								<PlusIcon className="h-4 w-4" />
								<span className="ml-2">Add Event</span>
							</Button>
						}
					/>
					<div className="mt-8 flex flex-col">
						<div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<table className="min-w-full divide-y divide-gray-300">
									<thead>
										<tr>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Name
											</th>

											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Schedule
											</th>

											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Team One
											</th>

											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Team Two
											</th>

											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Stadium
											</th>
											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{events.map((event) => (
											<tr key={event.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													<p>{event.name}</p>
													<span className="text-gray-500">
														{event.sport.name}
													</span>
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													<p>{formatDateTime(event.startDateTime)} -</p>
													<p>{formatDateTime(event.endDateTime)}</p>
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{event.teamOne.name}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{event.teamTwo.name}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{event.stadium.name}
												</td>
												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
													<div className="flex items-center gap-6">
														<Button
															loading={isSubmitting}
															variant="subtle"
															loaderPosition="right"
															disabled={
																new Date(event.startDateTime) < new Date()
															}
															onClick={() => {
																setSelectedEventId(event.id)
																setMode(MODE.edit)
															}}
														>
															Edit
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>

			<CustomDrawer
				opened={isModalOpen}
				onClose={() => {
					setSelectedEventId(null)
					handleModal.close()
				}}
				title={clsx({
					"Edit Event": mode === MODE.edit,
					"Add Event": mode === MODE.add,
				})}
				overlayProps={{blur: 1.2, opacity: 0.6}}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="eventId" value={selectedEvent?.id} />

						<TextInput
							name="name"
							label="Name"
							placeholder="Enter event name"
							defaultValue={selectedEvent?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<Textarea
							name="description"
							label="Description"
							placeholder="Enter event description"
							defaultValue={selectedEvent?.description}
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<div className="grid grid-cols-2 gap-4">
							<Tooltip.Floating
								label="Cannot edit once event is created"
								color="blue"
								disabled={mode === MODE.add}
							>
								<div>
									<Select
										name="sportId"
										label="Sport"
										placeholder="Select a sport"
										value={selectedSportId}
										onChange={(val) => setSelectedSportId(val)}
										data={sports.map((sport) => ({
											label: sport.name,
											value: sport.id,
										}))}
										error={fetcher.data?.fieldErrors?.sportId}
										readOnly={
											Boolean(selectedTeamOneId) ||
											Boolean(selectedTeamTwoId) ||
											mode === MODE.edit
										}
										required
									/>
								</div>
							</Tooltip.Floating>

							<Tooltip.Floating
								label="Cannot edit once event is created"
								color="blue"
								disabled={mode === MODE.add}
							>
								<div>
									<Select
										name="stadiumId"
										label="Stadium"
										placeholder="Select a stadium"
										defaultValue={selectedEvent?.stadium.id}
										data={stadiums.map((stadium) => ({
											label: stadium.name,
											value: stadium.id,
										}))}
										error={fetcher.data?.fieldErrors?.stadiumId}
										readOnly={mode === MODE.edit}
										required
									/>
								</div>
							</Tooltip.Floating>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<Tooltip.Floating
								label="Cannot edit once event is created"
								color="blue"
								disabled={mode === MODE.add}
							>
								<div>
									<Select
										name="teamOneId"
										label="Team One"
										placeholder="Select a team"
										clearable
										value={selectedTeamOneId}
										onChange={(val) => setSelectedTeamOneId(val)}
										data={teams
											.filter((t) => t.sport.id === selectedSportId)
											.map((sport) => ({
												label: sport.name,
												value: sport.id,
											}))}
										error={fetcher.data?.fieldErrors?.teamOneId}
										nothingFound="No teams found"
										readOnly={selectedSportId === null || mode === MODE.edit}
										required
									/>
								</div>
							</Tooltip.Floating>

							<Tooltip.Floating
								label="Cannot edit once event is created"
								color="blue"
								disabled={mode === MODE.add}
							>
								<div>
									<Select
										name="teamTwoId"
										label="Team Two"
										placeholder="Select a team"
										clearable
										value={selectedTeamTwoId}
										onChange={(val) => setSelectedTeamTwoId(val)}
										data={teams
											.filter(
												(t) =>
													t.sport.id === selectedSportId &&
													t.id !== selectedTeamOneId
											)
											.map((sport) => ({
												label: sport.name,
												value: sport.id,
											}))}
										error={fetcher.data?.fieldErrors?.teamTwoId}
										readOnly={selectedTeamOneId === null || mode === MODE.edit}
										nothingFound="No teams found"
										required
									/>
								</div>
							</Tooltip.Floating>
						</div>

						<DateTimePicker
							valueFormat="MMM DD 'YY - hh:mm A"
							name="startDateTime"
							label="Event Start"
							minDate={
								mode === MODE.edit
									? new Date()
									: new Date(Date.now() + 86400000)
							}
							placeholder="Select a date & time"
							value={selectedStartDateTime}
							onChange={(val) => setSelectedStartDateTime(val)}
							error={fetcher.data?.fieldErrors?.startDateTime}
							withAsterisk
						/>

						<DateTimePicker
							valueFormat="MMM DD 'YY - hh:mm A"
							name="endDateTime"
							label="End Date & Time"
							placeholder="Select a date & time"
							minDate={
								mode === MODE.edit
									? new Date()
									: selectedStartDateTime ?? new Date(Date.now() + 86400000)
							}
							value={selectedEndDateTime}
							onChange={(val) => setSelectedEndDateTime(val)}
							disabled={selectedStartDateTime === null}
							error={fetcher.data?.fieldErrors?.endDateTime}
							withAsterisk
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setSelectedEvent(null)
									handleModal.close()
								}}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								disabled={
									!selectedTeamTwoId ||
									!selectedTeamOneId ||
									!selectedSportId ||
									!selectedStartDateTime ||
									!selectedEndDateTime
								}
								loaderPosition="right"
							>
								{mode === MODE.edit ? "Save changes" : "Add event"}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</CustomDrawer>
		</>
	)
}
