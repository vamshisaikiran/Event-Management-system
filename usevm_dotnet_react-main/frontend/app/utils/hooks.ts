import {useMatches} from "@remix-run/react"
import * as React from "react"
import type {RootLoaderData} from "~/root"
import type {StudentLoaderData} from "~/routes/__student"
/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} routeId The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
	routeId: string
): Record<string, unknown> | undefined {
	const matchingRoutes = useMatches()

	const route = React.useMemo(
		() => matchingRoutes.find((route) => route.id === routeId),
		[matchingRoutes, routeId]
	)
	return route?.data
}

export function useOptionalUser() {
	return useMatchesData("root") as RootLoaderData
}

export function useUser() {
	const {user} = useOptionalUser()

	if (!user) throw new Error("No user found")

	return user
}

export function useStudentData() {
	return useMatchesData("routes/__student") as StudentLoaderData
}
