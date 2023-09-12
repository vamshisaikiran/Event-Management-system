import {PlusIcon} from "@heroicons/react/24/solid"
import {Button, Select, TextInput, clsx} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import type {ActionFunction} from "@remix-run/node"
import {json} from "@remix-run/node"
import {useFetcher, useLoaderData} from "@remix-run/react"
import * as React from "react"
import {z} from "zod"
import {TailwindContainer} from "~/components/TailwindContainer"
import {CustomDrawer} from "~/components/ui/CustomDrawer"
import {PageHeading} from "~/components/ui/PageHeading"
import {getAllSports} from "~/lib/sport.server"
import {createTeam, getAllTeams, updateTeam} from "~/lib/team.server"
import {badRequest} from "~/utils/misc.server"
import type {inferErrors} from "~/utils/validation"
import {validateAction} from "~/utils/validation"

enum MODE {
	edit,
	add,
}

const ManageTeamSchema = z.object({
	teamId: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	sportId: z.string().min(1, "Sport is required"),
})

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageTeamSchema>
}

export const loader = async () => {
	const teamResponse = await getAllTeams()
	const sportsResponse = await getAllSports()

	if (!teamResponse.success || !sportsResponse.success) {
		return json({teams: [], sports: []})
	}

	const teams = teamResponse.data!
	const sports = sportsResponse.data!

	return json({teams, sports})
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(request, ManageTeamSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const {teamId, ...rest} = fields
	if (teamId) {
		await updateTeam(teamId, rest)
		return json({success: true})
	}

	await createTeam({...rest})

	return json({success: true})
}

export default function ManageTeams() {
	const fetcher = useFetcher<ActionData>()
	const {teams, sports} = useLoaderData<typeof loader>()

	type _Team = (typeof teams)[number]

	const [selectedTeamId, setSelectedTeamId] = React.useState<
		_Team["id"] | null
	>(null)
	const [selectedTeam, setSelectedTeam] = React.useState<_Team | null>(null)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== "idle"

	React.useEffect(() => {
		if (fetcher.state !== "idle" && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedTeamId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	React.useEffect(() => {
		if (!selectedTeamId) {
			setSelectedTeam(null)
			return
		}

		const stadium = teams.find((stadium) => stadium.id === selectedTeamId)
		if (!stadium) return

		setSelectedTeam(stadium)
		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teams, selectedTeamId])

	return (
		<>
			<TailwindContainer className="rounded-md">
				<div className="px-4 py-10 sm:px-6 lg:px-8">
					<PageHeading
						title="Manage Teams"
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
								<span className="ml-2">Add Team</span>
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
												Sport
											</th>
											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{teams.map((team) => (
											<tr key={team.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{team.name}
												</td>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{team.sport.name}
												</td>
												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
													<div className="flex items-center gap-6">
														<Button
															loading={isSubmitting}
															variant="subtle"
															loaderPosition="right"
															onClick={() => {
																setSelectedTeamId(team.id)
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
					setSelectedTeamId(null)
					handleModal.close()
				}}
				title={clsx({
					"Edit Team": mode === MODE.edit,
					"Add Team": mode === MODE.add,
				})}
				overlayProps={{blur: 1.2, opacity: 0.6}}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="teamId" value={selectedTeam?.id} />

						<TextInput
							name="name"
							label="Name"
							defaultValue={selectedTeam?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<Select
							name="sportId"
							label="Sport"
							data={sports.map((sport) => ({
								value: sport.id,
								label: sport.name,
							}))}
							defaultValue={selectedTeam?.sport.id}
							error={fetcher.data?.fieldErrors?.sportId}
							required
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setSelectedTeam(null)
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
								{mode === MODE.edit ? "Save changes" : "Add team"}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</CustomDrawer>
		</>
	)
}
