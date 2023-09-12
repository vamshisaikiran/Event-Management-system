import appConfig from "app.config"

export function Footer() {
	return (
		<footer className="flex h-[44px] items-center justify-center px-6 py-1 text-center text-sm">
			<span className="text-gray-400">
				©{new Date().getFullYear()} {appConfig.name}, Inc. All rights reserved.
			</span>
		</footer>
	)
}
