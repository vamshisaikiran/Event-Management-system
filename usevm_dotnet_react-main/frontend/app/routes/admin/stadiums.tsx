import {PlusIcon} from "@heroicons/react/24/solid"
import {Button, NumberInput, TextInput, Textarea, clsx} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import type {ActionFunction} from "@remix-run/node"
import {json} from "@remix-run/node"
import {useFetcher, useLoaderData} from "@remix-run/react"
import * as React from "react"
import {z} from "zod"
import {TailwindContainer} from "~/components/TailwindContainer"
import {CustomDrawer} from "~/components/ui/CustomDrawer"
import {PageHeading} from "~/components/ui/PageHeading"
import {
	createStadium,
	getAllStadiums,
	updateStadium,
} from "~/lib/stadium.server"
import {badRequest} from "~/utils/misc.server"
import type {inferErrors} from "~/utils/validation"
import {validateAction} from "~/utils/validation"

enum MODE {
	edit,
	add,
}

const ManageStadiumSchema = z.object({
	stadiumId: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	address: z.string().min(1, "Abbreviation is required"),
	capacity: z.string().transform(Number),
})

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageStadiumSchema>
}

export const loader = async () => {
	const stadiumResponse = await getAllStadiums()

	if (!stadiumResponse.success) {
		return json({stadiums: []})
	}

	const stadiums = stadiumResponse.data!
	return json({stadiums})
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(
		request,
		ManageStadiumSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const {stadiumId, ...rest} = fields
	if (stadiumId) {
		await updateStadium(stadiumId, rest)
		return json({success: true})
	}

	await createStadium({...rest})

	return json({success: true})
}

export default function ManageStadium() {
	const fetcher = useFetcher<ActionData>()
	const {stadiums} = useLoaderData<typeof loader>()

	type _Stadium = (typeof stadiums)[number]

	const [selectedStadiumId, setSelectedStadiumId] = React.useState<
		_Stadium["id"] | null
	>(null)
	const [selectedStadium, setSelectedStadium] = React.useState<_Stadium | null>(
		null
	)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== "idle"

	React.useEffect(() => {
		if (fetcher.state !== "idle" && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedStadiumId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	React.useEffect(() => {
		if (!selectedStadiumId) {
			setSelectedStadium(null)
			return
		}

		const stadium = stadiums.find((stadium) => stadium.id === selectedStadiumId)
		if (!stadium) return

		setSelectedStadium(stadium)
		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stadiums, selectedStadiumId])

	return (
		<>
			<TailwindContainer className="rounded-md">
				<div className="px-4 py-10 sm:px-6 lg:px-8">
					<PageHeading
						title="Manage Stadiums"
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
								<span className="ml-2">Add Stadium</span>
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
												Address
											</th>

											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Capacity
											</th>

											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{stadiums.map((stadium) => (
											<tr key={stadium.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{stadium.name}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{stadium.address}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{stadium.capacity}
												</td>
												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
													<div className="flex items-center gap-6">
														<Button
															loading={isSubmitting}
															variant="subtle"
															loaderPosition="right"
															onClick={() => {
																setSelectedStadiumId(stadium.id)
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
					setSelectedStadiumId(null)
					handleModal.close()
				}}
				title={clsx({
					"Edit Stadium": mode === MODE.edit,
					"Add Stadium": mode === MODE.add,
				})}
				overlayProps={{blur: 1.2, opacity: 0.6}}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="stadiumId" value={selectedStadium?.id} />

						<TextInput
							name="name"
							label="Name"
							defaultValue={selectedStadium?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<Textarea
							name="address"
							label="Address"
							defaultValue={selectedStadium?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<NumberInput
							name="capacity"
							label="Max Capacity"
							defaultValue={selectedStadium?.capacity}
							error={fetcher.data?.fieldErrors?.capacity}
							required
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setSelectedStadium(null)
									handleModal.close()
								}}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								{mode === MODE.edit ? "Save changes" : "Add stadium"}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</CustomDrawer>
		</>
	)
}
