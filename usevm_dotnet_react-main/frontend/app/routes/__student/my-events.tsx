import {InformationCircleIcon} from "@heroicons/react/24/solid"
import {Alert, Badge, Button, Group, Select, Text} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import type {DataFunctionArgs, SerializeFrom} from "@remix-run/node"
import {json} from "@remix-run/node"
import {useFetcher, useLoaderData} from "@remix-run/react"
import {ListXIcon, Plus} from "lucide-react"
import * as React from "react"
import {toast} from "sonner"
import invariant from "tiny-invariant"
import {z} from "zod"
import {CustomDrawer} from "~/components/ui/CustomDrawer"
import {EmptyState} from "~/components/ui/EmptyState"
import {PageHeading} from "~/components/ui/PageHeading"
import {
	Table,
	TableBody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
} from "~/components/ui/table"
import {getAllEvents} from "~/lib/event.server"
import {
	createReservation,
	getReservationsByStudentId,
} from "~/lib/reservation.server"
import {requireUserId} from "~/session.server"
import {formatDateTime} from "~/utils/misc"
import {badRequest} from "~/utils/misc.server"
import {validateAction, type inferErrors} from "~/utils/validation"

const CreateReservationSchema = z.object({
	eventId: z.string().min(1, "EventId is required"),
})

interface ActionData {
	success: boolean
	message: string
	fieldErrors?: inferErrors<typeof CreateReservationSchema>
}

export const loader = async ({request}: DataFunctionArgs) => {
	const studentId = await requireUserId(request)

	const eventsResponse = await getAllEvents()
	const reservationsResponse = await getReservationsByStudentId(studentId)

	if (eventsResponse.success && reservationsResponse.success) {
		const events = eventsResponse.data
		const reservations = reservationsResponse.data

		invariant(events && reservations, "Events and reservations must be defined")

		return json({
			events,
			reservations,
		})
	}

	return json({
		events: [],
		reservations: [],
	})
}

export const action = async ({request}: DataFunctionArgs) => {
	const studentId = await requireUserId(request)
	const {fields, fieldErrors} = await validateAction(
		request,
		CreateReservationSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({
			success: false,
			message: "Invalid fields",
			fieldErrors,
		})
	}

	const response = await createReservation({
		studentId,
		eventId: fields.eventId,
	})

	if (!response.success) {
		return badRequest<ActionData>({
			success: false,
			message: response.message,
			fieldErrors: {
				eventId: response.message,
			},
		})
	}

	return json<ActionData>({
		success: true,
		message: response.message,
	})
}

export default function Events() {
	const {reservations, events} = useLoaderData<typeof loader>()

	const fetcher = useFetcher<ActionData>()
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== "idle"

	React.useEffect(() => {
		if (fetcher.state !== "idle") {
			return
		}

		if (!fetcher.data) return

		if (fetcher.data.success) {
			toast.success(fetcher.data.message)
			handleModal.close()
		} else {
			toast.error(fetcher.data.message)
		}

		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data, fetcher.state])

	return (
		<>
			<div className="flex max-w-screen-xl flex-col gap-12 p-10">
				<div className="flex flex-col gap-8">
					<PageHeading
						title="My Events"
						rightSection={
							<Button
								color="dark"
								radius="md"
								onClick={() => handleModal.open()}
								leftIcon={<Plus size={18} />}
							>
								Reserve Tickets
							</Button>
						}
					/>

					{reservations.length > 0 ? (
						<div className="flow-root">
							<div className="inline-block min-w-full py-2 align-middle">
								<Table>
									<TableThead>
										<TableTr>
											<TableTh pos="first">Event</TableTh>
											<TableTh>Schedule</TableTh>
											<TableTh>Seat Number</TableTh>
											<TableTh>Event Status</TableTh>
											<TableTh pos="last">
												<span className="sr-only">Actions</span>
											</TableTh>
										</TableTr>
									</TableThead>
									<TableBody>
										{reservations.map((reservation, idx) => (
											<ReservationRow
												idx={idx}
												key={reservation.id}
												reservation={reservation}
											/>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					) : (
						<EmptyState
							label="No events has been reserved"
							icon={<ListXIcon size={70} className="text-gray-600" />}
						/>
					)}
				</div>
			</div>

			<CustomDrawer
				opened={isModalOpen}
				onClose={() => handleModal.close()}
				title="Buy tickets"
				overlayProps={{
					opacity: 0.6,
					blur: 1.2,
				}}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						{fetcher.data?.fieldErrors?.eventId && (
							<Alert
								icon={<InformationCircleIcon className="h-6 w-6" />}
								title="Error"
								color="red"
							>
								{fetcher.data.fieldErrors.eventId}
							</Alert>
						)}

						<Select
							name="eventId"
							label="Event"
							withinPortal
							placeholder="Select an event"
							nothingFound="No events found"
							itemComponent={SelectItem}
							data={events.map((event) => {
								const availableSeats = event.capacity - event.reservedSeats

								return {
									start: event.startDateTime,
									end: event.endDateTime,
									address: event.stadium.name,
									label: `${event.name} (${availableSeats} seats available)`,
									value: event.id,
									disabled: availableSeats === 0,
								}
							})}
							error={Boolean(fetcher.data?.fieldErrors?.eventId)}
							required
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => handleModal.close()}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								Reserve your seat
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</CustomDrawer>
		</>
	)
}

function ReservationRow({
	reservation,
	idx,
}: {
	reservation: SerializeFrom<typeof loader>["reservations"][number]
	idx: number
}) {
	const {reservations} = useLoaderData<typeof loader>()
	const isLastIndex = reservations.length - 1 === idx

	return (
		<TableTr key={reservation.id} hasBorder={!isLastIndex}>
			<TableTd pos="first">{reservation.event.name}</TableTd>

			<TableTd>
				<p>{formatDateTime(reservation.event.startDateTime)}</p>
				<p>{formatDateTime(reservation.event.endDateTime)}</p>
			</TableTd>

			<TableTd>{reservation.seatNumber}</TableTd>

			<TableTd>
				<Badge color={reservation.isCancelled ? "red" : "green"}>
					{reservation.isCancelled ? "Cancelled" : "Active"}
				</Badge>
			</TableTd>

			<TableTd pos="last"></TableTd>
		</TableTr>
	)
}

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
	start: string
	end: string
	address: string
	label: string
}

const SelectItem = React.forwardRef<HTMLDivElement, ItemProps>(
	(props: ItemProps, ref) => {
		const {start, end, address, label, ...others} = props
		return (
			<div ref={ref} {...others}>
				<Group noWrap>
					<div>
						<Text size="sm">{label}</Text>
						<Text size="xs" opacity={0.65}>
							{address}
						</Text>
						<Text size="xs" opacity={0.65}>
							{formatDateTime(start)} - {formatDateTime(end)})
						</Text>
					</div>
				</Group>
			</div>
		)
	}
)
