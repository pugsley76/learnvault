import {
	Contract,
	TransactionBuilder,
	nativeToScVal,
	rpc as StellarRpc,
	scValToNative,
} from "@stellar/stellar-sdk"
import { useEffect, useState } from "react"
import { useToast } from "../components/Toast/ToastProvider"
import { networkPassphrase, rpcUrl, stellarNetwork } from "../contracts/util"
import { useContractIds } from "./useContractIds"
import { useWallet } from "./useWallet"

export interface DonorContribution {
	txHash: string
	amount: number
	date: string
	block: number
}

export interface DonorStats {
	totalContributed: number
	governanceBalance: number
	governancePercentage: number
	proposalsVoted: number
	scholarsFunded: number
}

export interface Vote {
	proposalId: string
	proposalTitle: string
	voteChoice: "for" | "against"
	votePower: number
	status: "active" | "passed" | "rejected"
}

export interface Scholar {
	id: string
	name: string
	proposalAmount: number
	fundedPercentage: number
	progressPercentage: number
	status: "active" | "completed"
}

export interface DonorData {
	stats: DonorStats
	contributions: DonorContribution[]
	votes: Vote[]
	scholars: Scholar[]
	isLoading: boolean
	error: string | null
}

interface RpcEvent {
	id?: string
	ledger?: number
	ledgerCloseTime?: string
	txHash?: string
	topic?: unknown[]
	topics?: unknown[]
	value?: unknown
}

interface NormalizedProposal {
	id: number
	applicant: string
	title: string
	amount: number
	deadlineLedger: number
	yesVotes: bigint
	noVotes: bigint
}

const readEnv = (key: string): string | undefined => {
	const value = (import.meta.env as Record<string, unknown>)[key]
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: undefined
}

const TOKEN_DECIMALS = 7
const TOKEN_FACTOR = 10 ** TOKEN_DECIMALS

const emptyStats: DonorStats = {
	totalContributed: 0,
	governanceBalance: 0,
	governancePercentage: 0,
	proposalsVoted: 0,
	scholarsFunded: 0,
}

const makeEmptyData = (): DonorData => ({
	stats: emptyStats,
	contributions: [],
	votes: [],
	scholars: [],
	isLoading: true,
	error: null,
})

const rpcServer = new StellarRpc.Server(rpcUrl, {
	allowHttp: stellarNetwork === "LOCAL",
})

const stringifyLower = (value: unknown): string =>
	JSON.stringify(value ?? null).toLowerCase()

const eventTopics = (event: RpcEvent): unknown[] => {
	if (Array.isArray(event.topics)) return event.topics
	if (Array.isArray(event.topic)) return event.topic
	return []
}

const eventContains = (event: RpcEvent, needle: string): boolean =>
	stringifyLower({
		topics: eventTopics(event),
		value: event.value,
	}).includes(needle.toLowerCase())

const eventHasTopic = (event: RpcEvent, topic: string): boolean =>
	eventTopics(event).some((entry) =>
		stringifyLower(entry).includes(topic.toLowerCase()),
	)

const collectNumbers = (value: unknown): bigint[] => {
	if (typeof value === "bigint") return [value]
	if (typeof value === "number" && Number.isFinite(value)) {
		return [BigInt(Math.trunc(value))]
	}
	if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
		try {
			return [BigInt(value.trim())]
		} catch {
			return []
		}
	}
	if (Array.isArray(value)) {
		return value.flatMap((item) => collectNumbers(item))
	}
	if (value && typeof value === "object") {
		return Object.values(value).flatMap((item) => collectNumbers(item))
	}
	return []
}

const collectBooleans = (value: unknown): boolean[] => {
	if (typeof value === "boolean") return [value]
	if (Array.isArray(value)) {
		return value.flatMap((item) => collectBooleans(item))
	}
	if (value && typeof value === "object") {
		return Object.values(value).flatMap((item) => collectBooleans(item))
	}
	return []
}

const collectAddresses = (value: unknown): string[] => {
	if (typeof value === "string" && /^G[A-Z0-9]{20,}$/.test(value)) {
		return [value]
	}
	if (Array.isArray(value)) {
		return value.flatMap((item) => collectAddresses(item))
	}
	if (value && typeof value === "object") {
		return Object.values(value).flatMap((item) => collectAddresses(item))
	}
	return []
}

const extractAtomicAmount = (value: unknown): bigint => {
	const numericValues = collectNumbers(value).filter((entry) => entry > 0n)
	return numericValues.reduce(
		(largest, entry) => (entry > largest ? entry : largest),
		0n,
	)
}

const atomicToDisplay = (value: bigint): number => Number(value) / TOKEN_FACTOR

const toBigInt = (value: unknown): bigint => {
	if (typeof value === "bigint") return value
	if (typeof value === "number" && Number.isFinite(value)) {
		return BigInt(Math.trunc(value))
	}
	if (typeof value === "string" && value.trim().length > 0) {
		try {
			return BigInt(value.trim())
		} catch {
			return 0n
		}
	}
	return 0n
}

const toNumber = (value: unknown): number => Number(toBigInt(value))

const toSafeDate = (value: string | undefined): string => {
	const parsed = value ? new Date(value) : new Date()
	return Number.isNaN(parsed.getTime())
		? new Date().toISOString()
		: parsed.toISOString()
}

const shortenAddress = (value: string): string =>
	value.length <= 12 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`

const readContractEvents = async (
	contractIds: string[],
): Promise<RpcEvent[]> => {
	if (!contractIds.length) return []

	try {
		const response = await fetch(rpcUrl, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: "donor-events",
				method: "getEvents",
				params: {
					filters: [{ type: "contract", contractIds }],
					pagination: { limit: 200 },
				},
			}),
		})

		if (!response.ok) return []

		const payload = (await response.json()) as {
			result?: { events?: RpcEvent[] }
		}

		return payload.result?.events ?? []
	} catch {
		return []
	}
}

const readLatestLedgerSequence = async (): Promise<number> => {
	try {
		const response = await fetch(rpcUrl, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: "latest-ledger",
				method: "getLatestLedger",
			}),
		})

		if (!response.ok) return 0

		const payload = (await response.json()) as {
			result?: { sequence?: number }
		}

		return payload.result?.sequence ?? 0
	} catch {
		return 0
	}
}

const simulateRead = async (
	contractId: string | undefined,
	sourceAddress: string,
	method: string,
	args: unknown[] = [],
): Promise<unknown> => {
	if (!contractId) return null

	try {
		const sourceAccount = await rpcServer.getAccount(sourceAddress)
		const contract = new Contract(contractId)
		const operation = contract.call(
			method,
			...args.map((arg) => {
				if (typeof arg === "string" && arg.startsWith("G")) {
					return nativeToScVal(arg, { type: "address" })
				}
				return nativeToScVal(arg)
			}),
		)

		const tx = new TransactionBuilder(sourceAccount, {
			fee: "100",
			networkPassphrase,
		})
			.addOperation(operation)
			.setTimeout(30)
			.build()

		const simulated = await rpcServer.simulateTransaction(tx)
		const result = (simulated as { result?: { retval?: unknown } }).result
			?.retval

		return result ? scValToNative(result) : null
	} catch {
		return null
	}
}

const readFirstAvailable = async (
	contractId: string | undefined,
	sourceAddress: string,
	methods: Array<{ name: string; args?: unknown[] }>,
): Promise<unknown> => {
	for (const method of methods) {
		const value = await simulateRead(
			contractId,
			sourceAddress,
			method.name,
			method.args ?? [],
		)
		if (value !== null && value !== undefined) return value
	}
	return null
}

const normalizeProposal = (value: unknown): NormalizedProposal | null => {
	if (!value || typeof value !== "object") return null

	const raw = value as Record<string, unknown>
	const id = toNumber(raw.id)
	const applicant = typeof raw.applicant === "string" ? raw.applicant : ""
	if (!id || !applicant) return null

	const titleCandidate =
		typeof raw.program_name === "string"
			? raw.program_name
			: typeof raw.title === "string"
				? raw.title
				: ""

	return {
		id,
		applicant,
		title: titleCandidate || `Scholarship Proposal #${id}`,
		amount: atomicToDisplay(toBigInt(raw.amount)),
		deadlineLedger: toNumber(
			raw.deadline_ledger ?? raw.endDate ?? raw.end_date,
		),
		yesVotes: toBigInt(raw.yes_votes ?? raw.votes_for ?? raw.votesFor),
		noVotes: toBigInt(raw.no_votes ?? raw.votes_against ?? raw.votesAgainst),
	}
}

const deriveProposalStatus = (
	proposal: NormalizedProposal | undefined,
	currentLedger: number,
): Vote["status"] => {
	if (!proposal) return "active"
	if (currentLedger > 0 && proposal.deadlineLedger > currentLedger)
		return "active"
	return proposal.yesVotes >= proposal.noVotes ? "passed" : "rejected"
}

export const useDonor = (): DonorData => {
	const { address } = useWallet()
	const { scholarshipTreasury, governanceToken } = useContractIds()
	const { showError } = useToast()
	const [data, setData] = useState<DonorData>(makeEmptyData())
	const treasuryContractId =
		readEnv("PUBLIC_SCHOLARSHIP_TREASURY_CONTRACT") ?? scholarshipTreasury
	const governanceContractId =
		readEnv("PUBLIC_GOVERNANCE_TOKEN_CONTRACT") ?? governanceToken

	useEffect(() => {
		let isCancelled = false

		const loadData = async () => {
			if (!address) {
				if (!isCancelled) {
					setData({
						...makeEmptyData(),
						isLoading: false,
					})
				}
				return
			}

			if (!isCancelled) {
				setData((prev) => ({
					...prev,
					isLoading: true,
					error: null,
				}))
			}

			try {
				const events = await readContractEvents(
					[treasuryContractId, governanceContractId].filter(
						(id): id is string => Boolean(id),
					),
				)

				const [
					donorTotalRaw,
					governanceBalanceRaw,
					totalSupplyRaw,
					proposalCountRaw,
					currentLedger,
				] = await Promise.all([
					readFirstAvailable(treasuryContractId, address, [
						{ name: "get_donor_total", args: [address] },
						{ name: "donor_contribution", args: [address] },
					]),
					readFirstAvailable(governanceContractId, address, [
						{ name: "balance", args: [address] },
					]),
					readFirstAvailable(governanceContractId, address, [
						{ name: "total_supply" },
					]),
					readFirstAvailable(treasuryContractId, address, [
						{ name: "get_proposal_count" },
					]),
					readLatestLedgerSequence(),
				])

				const proposalCount = toNumber(proposalCountRaw)
				const proposals = (
					await Promise.all(
						Array.from({ length: proposalCount }, (_, index) =>
							readFirstAvailable(treasuryContractId, address, [
								{ name: "get_proposal", args: [index + 1] },
							]),
						),
					)
				)
					.map((entry) => normalizeProposal(entry))
					.filter((entry): entry is NormalizedProposal => entry !== null)

				const proposalsById = new Map(
					proposals.map((proposal) => [proposal.id, proposal] as const),
				)

				const depositEvents = events
					.filter(
						(event) =>
							eventHasTopic(event, "deposit") && eventContains(event, address),
					)
					.sort((left, right) => (right.ledger ?? 0) - (left.ledger ?? 0))

				const contributions = depositEvents.map((event, index) => ({
					txHash: event.txHash ?? event.id ?? `deposit-${index}`,
					amount: atomicToDisplay(extractAtomicAmount(event.value)),
					date: toSafeDate(event.ledgerCloseTime).split("T")[0],
					block: event.ledger ?? 0,
				}))

				const donorStartLedger =
					contributions.length > 0
						? contributions.reduce(
								(lowest, contribution) =>
									Math.min(
										lowest,
										contribution.block || Number.MAX_SAFE_INTEGER,
									),
								Number.MAX_SAFE_INTEGER,
							)
						: Number.MAX_SAFE_INTEGER

				const voteEvents = events
					.filter(
						(event) =>
							eventHasTopic(event, "vote") && eventContains(event, address),
					)
					.sort((left, right) => (right.ledger ?? 0) - (left.ledger ?? 0))

				const votes = voteEvents.map((event, index) => {
					const numericValues = collectNumbers(event.value)
					const proposalId =
						numericValues.find((entry) => entry >= 0n && entry < 1_000_000n) ??
						0n
					const proposal = proposalsById.get(Number(proposalId))
					const support = collectBooleans(event.value)[0] ?? true
					const votePowerAtomic = numericValues.reduce(
						(largest, entry) => (entry > largest ? entry : largest),
						0n,
					)

					return {
						proposalId: `${(proposal?.id ?? Number(proposalId)) || index + 1}`,
						proposalTitle:
							proposal?.title ??
							`Scholarship Proposal #${Number(proposalId) || index + 1}`,
						voteChoice: support ? "for" : "against",
						votePower: atomicToDisplay(votePowerAtomic),
						status: deriveProposalStatus(proposal, currentLedger),
					}
				})

				const disbursementEvents = events
					.filter((event) => eventHasTopic(event, "disburse"))
					.filter(
						(event) =>
							donorStartLedger === Number.MAX_SAFE_INTEGER ||
							(event.ledger ?? 0) >= donorStartLedger,
					)
					.sort((left, right) => (right.ledger ?? 0) - (left.ledger ?? 0))

				const disbursedByRecipient = new Map<
					string,
					{ amountAtomic: bigint; latestLedger: number }
				>()

				for (const event of disbursementEvents) {
					const recipient = collectAddresses({
						topics: eventTopics(event),
						value: event.value,
					})[0]
					if (!recipient) continue

					const previous = disbursedByRecipient.get(recipient)
					disbursedByRecipient.set(recipient, {
						amountAtomic:
							(previous?.amountAtomic ?? 0n) + extractAtomicAmount(event.value),
						latestLedger: Math.max(
							previous?.latestLedger ?? 0,
							event.ledger ?? 0,
						),
					})
				}

				const donorTotal =
					atomicToDisplay(toBigInt(donorTotalRaw)) ||
					contributions.reduce(
						(sum, contribution) => sum + contribution.amount,
						0,
					)
				const governanceBalance = atomicToDisplay(
					toBigInt(governanceBalanceRaw),
				)
				const totalSupply = atomicToDisplay(toBigInt(totalSupplyRaw))

				const scholars = Array.from(disbursedByRecipient.entries())
					.map(([recipient, funding]) => {
						const proposal = proposals
							.filter((entry) => entry.applicant === recipient)
							.sort((left, right) => right.id - left.id)[0]

						const proposalAmount =
							proposal?.amount || atomicToDisplay(funding.amountAtomic)
						const progressPercentage =
							proposalAmount > 0
								? Math.min(
										100,
										(atomicToDisplay(funding.amountAtomic) / proposalAmount) *
											100,
									)
								: 0
						const fundedPercentage =
							proposalAmount > 0
								? Math.min(100, (donorTotal / proposalAmount) * 100)
								: 0

						return {
							id: recipient,
							name: proposal?.title || `Scholar ${shortenAddress(recipient)}`,
							proposalAmount,
							fundedPercentage,
							progressPercentage,
							status: progressPercentage >= 100 ? "completed" : "active",
						}
					})
					.sort(
						(left, right) => right.progressPercentage - left.progressPercentage,
					)

				if (!isCancelled) {
					setData({
						stats: {
							totalContributed: donorTotal,
							governanceBalance,
							governancePercentage:
								totalSupply > 0 ? (governanceBalance / totalSupply) * 100 : 0,
							proposalsVoted: votes.length,
							scholarsFunded: scholars.length,
						},
						contributions,
						votes,
						scholars,
						isLoading: false,
						error: null,
					})
				}
			} catch {
				if (!isCancelled) {
					setData({
						...makeEmptyData(),
						isLoading: false,
						error: "Failed to load donor data",
					})
				}
				showError("Failed to load donor data")
			}
		}

		void loadData()

		return () => {
			isCancelled = true
		}
	}, [address, governanceContractId, treasuryContractId, showError])

	return data
}
