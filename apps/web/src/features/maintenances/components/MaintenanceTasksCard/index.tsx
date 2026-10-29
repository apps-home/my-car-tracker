'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@lib/ui/components/card'
import { Checkbox } from '@lib/ui/components/checkbox'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { cn } from '@lib/ui/lib/utils'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type {
	MaintenanceTask,
	MaintenanceTaskPriority
} from '../../api/types'
import {
	useCreateMaintenanceTask,
	useDeleteMaintenanceTask,
	useUpdateMaintenanceTask
} from '../../hooks/use-maintenances'

interface MaintenanceTasksCardProps {
	vehicleId: string
	tasks: MaintenanceTask[]
}

const PRIORITY_OPTIONS = [
	{ value: 'NEXT_VISIT', label: 'Próxima manutenção' },
	{ value: 'FUTURE', label: 'Futura / Longo prazo' }
]

export function MaintenanceTasksCard({
	vehicleId,
	tasks
}: MaintenanceTasksCardProps) {
	const [title, setTitle] = useState('')
	const [priority, setPriority] =
		useState<MaintenanceTaskPriority>('NEXT_VISIT')
	const [targetYear, setTargetYear] = useState('')

	const { mutateAsync: createTask, isPending: isCreating } =
		useCreateMaintenanceTask()
	const { mutate: updateTask } = useUpdateMaintenanceTask()
	const { mutate: deleteTask } = useDeleteMaintenanceTask()

	async function handleAdd(event: React.FormEvent) {
		event.preventDefault()
		const trimmed = title.trim()
		if (!trimmed) return

		const yearNumber = targetYear.trim() ? Number(targetYear.trim()) : null

		await createTask({
			vehicleId,
			title: trimmed,
			priority,
			targetYear:
				yearNumber && Number.isInteger(yearNumber) ? yearNumber : null
		})

		setTitle('')
		setTargetYear('')
	}

	const nextVisitTasks = tasks.filter((item) => item.priority === 'NEXT_VISIT')
	const futureTasks = tasks.filter((item) => item.priority === 'FUTURE')
	const pendingCount = tasks.filter((item) => !item.isCompleted).length

	return (
		<Card data-slot="maintenance-tasks-card">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ClipboardList className="size-4 text-primary" />
					Para fazer na oficina
					{pendingCount > 0 && (
						<Badge variant="secondary">{pendingCount}</Badge>
					)}
				</CardTitle>
				<CardDescription>
					Pendências para a próxima revisão e itens futuros
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<form onSubmit={handleAdd} className="flex flex-col gap-2">
					<Input
						placeholder="Ex.: Para-barro esquerdo, Sensor de ré..."
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="h-8 text-xs"
					/>
					<div className="flex items-center gap-2">
						<FilterSelect
							value={priority}
							onChange={(val) => setPriority(val as MaintenanceTaskPriority)}
							options={PRIORITY_OPTIONS}
							className="flex-1"
						/>
						<Input
							inputMode="numeric"
							placeholder="Ano (ex.: 2027)"
							value={targetYear}
							onChange={(e) => setTargetYear(e.target.value)}
							className="h-9 w-28 text-xs"
						/>
						<Button
							type="submit"
							size="sm"
							disabled={isCreating || !title.trim()}
						>
							<Plus />
						</Button>
					</div>
				</form>

				{tasks.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						Nenhuma pendência anotada para o veículo.
					</p>
				) : (
					<div className="flex flex-col gap-4 text-xs">
						{nextVisitTasks.length > 0 && (
							<div>
								<p className="mb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
									Próxima manutenção ({nextVisitTasks.length})
								</p>
								<TaskList
									items={nextVisitTasks}
									onToggle={(task) =>
										updateTask({
											id: task.id,
											dto: { isCompleted: !task.isCompleted }
										})
									}
									onDelete={(task) => deleteTask(task.id)}
								/>
							</div>
						)}

						{futureTasks.length > 0 && (
							<div>
								<p className="mb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
									Futuras manutenções ({futureTasks.length})
								</p>
								<TaskList
									items={futureTasks}
									onToggle={(task) =>
										updateTask({
											id: task.id,
											dto: { isCompleted: !task.isCompleted }
										})
									}
									onDelete={(task) => deleteTask(task.id)}
								/>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}

function TaskList({
	items,
	onToggle,
	onDelete
}: {
	items: MaintenanceTask[]
	onToggle: (task: MaintenanceTask) => void
	onDelete: (task: MaintenanceTask) => void
}) {
	return (
		<ul className="divide-y rounded-md border">
			{items.map((task) => (
				<li
					key={task.id}
					className="flex items-center gap-2.5 px-2.5 py-2"
				>
					<Checkbox
						checked={task.isCompleted}
						onCheckedChange={() => onToggle(task)}
					/>
					<div className="min-w-0 flex-1">
						<span
							className={cn(
								'block truncate font-medium',
								task.isCompleted && 'text-muted-foreground line-through'
							)}
						>
							{task.title}
						</span>
						{task.notes && (
							<span className="block truncate text-[11px] text-muted-foreground">
								{task.notes}
							</span>
						)}
					</div>
					{task.targetYear && (
						<Badge variant="outline">{task.targetYear}</Badge>
					)}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => onDelete(task)}
						aria-label="Remover pendência"
					>
						<Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
					</Button>
				</li>
			))}
		</ul>
	)
}

