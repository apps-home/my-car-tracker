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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@lib/ui/components/dialog'
import { FilterSelect } from '@lib/ui/components/FilterSelect'
import { Input } from '@lib/ui/components/input'
import { Label } from '@lib/ui/components/label'
import { cn } from '@lib/ui/lib/utils'
import { Check, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { MaintenanceTask, MaintenanceTaskPriority } from '../../api/types'
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
  { value: 'FUTURE', label: 'Futura / Longo prazo' },
  { value: 'RECURRING', label: 'Periódica' }
]

const MONTH_OPTIONS = [
  { value: '0', label: 'Sem mês' },
  ...[
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ].map((label, index) => ({ value: String(index + 1), label }))
]

const INTERVAL_UNIT_OPTIONS = [
  { value: 'days', label: 'Dias' },
  { value: 'months', label: 'Meses' }
]

const DAYS_PER_MONTH = 30

// Campos com borda e fundo mais visíveis no tema escuro
const FIELD_CLASS = 'h-9 border-border bg-background'
const SELECT_CLASS =
  '[&_[data-slot=select-trigger]]:border-border [&_[data-slot=select-trigger]]:bg-background'

function formatMonthYear(month: number | null, year: number | null) {
  if (!year) return null
  return month ? `${String(month).padStart(2, '0')}/${year}` : String(year)
}

function formatInterval(days: number | null) {
  if (!days) return ''
  if (days % DAYS_PER_MONTH === 0) {
    const months = days / DAYS_PER_MONTH
    return months === 1 ? 'todo mês' : `a cada ${months} meses`
  }
  return days === 1 ? 'todo dia' : `a cada ${days} dias`
}

function formatDueDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function isOverdue(iso: string | null) {
  return !!iso && new Date(iso).getTime() < Date.now()
}

interface TaskFormValues {
  title: string
  notes: string
  priority: MaintenanceTaskPriority
  targetYear: string
  targetMonth: string
  intervalValue: string
  intervalUnit: string
}

const EMPTY_FORM: TaskFormValues = {
  title: '',
  notes: '',
  priority: 'NEXT_VISIT',
  targetYear: '',
  targetMonth: '0',
  intervalValue: '',
  intervalUnit: 'days'
}

function taskToFormValues(task: MaintenanceTask): TaskFormValues {
  const days = task.intervalDays
  const inMonths = !!days && days % DAYS_PER_MONTH === 0

  return {
    title: task.title,
    notes: task.notes ?? '',
    priority: task.priority,
    targetYear: task.targetYear ? String(task.targetYear) : '',
    targetMonth: String(task.targetMonth ?? 0),
    intervalValue: days ? String(inMonths ? days / DAYS_PER_MONTH : days) : '',
    intervalUnit: inMonths ? 'months' : 'days'
  }
}

/** Converte o formulário no payload da API; retorna null se inválido */
function formValuesToPayload(values: TaskFormValues) {
  const title = values.title.trim()
  if (!title) return null

  const isRecurring = values.priority === 'RECURRING'
  const yearNumber = values.targetYear.trim()
    ? Number(values.targetYear.trim())
    : null
  const targetYear =
    yearNumber && Number.isInteger(yearNumber) ? yearNumber : null

  let intervalDays: number | null = null
  if (isRecurring) {
    const value = Number(values.intervalValue)
    if (!Number.isInteger(value) || value < 1) return null
    intervalDays =
      values.intervalUnit === 'months' ? value * DAYS_PER_MONTH : value
  }

  return {
    title,
    notes: values.notes.trim() || null,
    priority: values.priority,
    targetYear,
    // Mês só é válido junto com o ano
    targetMonth: targetYear ? Number(values.targetMonth) || null : null,
    intervalDays
  }
}

function TaskFormFields({
  idPrefix,
  values,
  onChange
}: {
  idPrefix: string
  values: TaskFormValues
  onChange: (values: TaskFormValues) => void
}) {
  const isRecurring = values.priority === 'RECURRING'
  const set = (patch: Partial<TaskFormValues>) =>
    onChange({ ...values, ...patch })

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-title`}>Tarefa</Label>
        <Input
          id={`${idPrefix}-title`}
          placeholder="Ex.: Para-barro esquerdo, Sensor de ré..."
          value={values.title}
          onChange={(e) => set({ title: e.target.value })}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-notes`}>Observação (opcional)</Label>
        <Input
          id={`${idPrefix}-notes`}
          placeholder="Ex.: Verificar, Pedir orçamento..."
          value={values.notes}
          onChange={(e) => set({ notes: e.target.value })}
          maxLength={1000}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tipo</Label>
        <FilterSelect
          value={values.priority}
          onChange={(val) => set({ priority: val as MaintenanceTaskPriority })}
          options={PRIORITY_OPTIONS}
          className={SELECT_CLASS}
        />
      </div>

      {isRecurring && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-interval`}>Repetir a cada</Label>
            <Input
              id={`${idPrefix}-interval`}
              inputMode="numeric"
              placeholder="Ex.: 15"
              value={values.intervalValue}
              onChange={(e) => set({ intervalValue: e.target.value })}
              className={FIELD_CLASS}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Unidade</Label>
            <FilterSelect
              value={values.intervalUnit}
              onChange={(val) => set({ intervalUnit: val })}
              options={INTERVAL_UNIT_OPTIONS}
              className={SELECT_CLASS}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label>{isRecurring ? 'Mês do 1º vencimento' : 'Mês'}</Label>
          <FilterSelect
            value={values.targetMonth}
            onChange={(val) => set({ targetMonth: val })}
            options={MONTH_OPTIONS}
            className={SELECT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-year`}>Ano</Label>
          <Input
            id={`${idPrefix}-year`}
            inputMode="numeric"
            placeholder="Ex.: 2027"
            value={values.targetYear}
            onChange={(e) => set({ targetYear: e.target.value })}
            className={FIELD_CLASS}
          />
        </div>
      </div>
    </>
  )
}

export function MaintenanceTasksCard({
  vehicleId,
  tasks
}: MaintenanceTasksCardProps) {
  const [form, setForm] = useState<TaskFormValues>(EMPTY_FORM)
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null)
  const [editForm, setEditForm] = useState<TaskFormValues>(EMPTY_FORM)

  const createPayload = formValuesToPayload(form)
  const editPayload = formValuesToPayload(editForm)

  const { mutateAsync: createTask, isPending: isCreating } =
    useCreateMaintenanceTask()
  const { mutate: updateTask, isPending: isUpdating } =
    useUpdateMaintenanceTask()
  const { mutate: deleteTask } = useDeleteMaintenanceTask()

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!createPayload) return

    await createTask({ vehicleId, ...createPayload })
    setForm(EMPTY_FORM)
  }

  function openEdit(task: MaintenanceTask) {
    setEditForm(taskToFormValues(task))
    setEditingTask(task)
  }

  function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault()
    if (!editingTask || !editPayload) return

    updateTask(
      { id: editingTask.id, dto: editPayload },
      {
        onSuccess: () => {
          toast.success('Tarefa atualizada!')
          setEditingTask(null)
        }
      }
    )
  }

  // Concluídas vão para o fim da lista
  const byCompletion = (a: MaintenanceTask, b: MaintenanceTask) =>
    Number(a.isCompleted) - Number(b.isCompleted)

  const nextVisitTasks = tasks
    .filter((item) => item.priority === 'NEXT_VISIT')
    .sort(byCompletion)
  const futureTasks = tasks
    .filter((item) => item.priority === 'FUTURE')
    .sort(byCompletion)
  const recurringTasks = tasks.filter((item) => item.priority === 'RECURRING')
  const pendingCount = tasks.filter(
    (item) => item.priority !== 'RECURRING' && !item.isCompleted
  ).length

  function toggleTask(task: MaintenanceTask) {
    updateTask({ id: task.id, dto: { isCompleted: !task.isCompleted } })
  }

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
          Pendências, itens futuros e tarefas periódicas
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3"
        >
          <TaskFormFields
            idPrefix="task-new"
            values={form}
            onChange={setForm}
          />

          <Button
            type="submit"
            size="lg"
            disabled={isCreating || !createPayload}
          >
            <Plus />
            Adicionar
          </Button>
        </form>

        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Nenhuma pendência anotada para o veículo.
          </p>
        ) : (
          <div className="flex flex-col gap-5 text-xs">
            {nextVisitTasks.length > 0 && (
              <TaskSection
                title="Próxima manutenção"
                count={nextVisitTasks.length}
              >
                <TaskList
                  items={nextVisitTasks}
                  onToggle={toggleTask}
                  onEdit={openEdit}
                  onDelete={(task) => deleteTask(task.id)}
                />
              </TaskSection>
            )}

            {futureTasks.length > 0 && (
              <TaskSection
                title="Futuras manutenções"
                count={futureTasks.length}
              >
                <TaskList
                  items={futureTasks}
                  onToggle={toggleTask}
                  onEdit={openEdit}
                  onDelete={(task) => deleteTask(task.id)}
                />
              </TaskSection>
            )}

            {recurringTasks.length > 0 && (
              <TaskSection title="Periódicas" count={recurringTasks.length}>
                <RecurringTaskList
                  items={recurringTasks}
                  onDone={(task) =>
                    updateTask({ id: task.id, dto: { markAsDone: true } })
                  }
                  onEdit={openEdit}
                  onDelete={(task) => deleteTask(task.id)}
                />
              </TaskSection>
            )}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
            <TaskFormFields
              idPrefix="task-edit"
              values={editForm}
              onChange={setEditForm}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingTask(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating || !editPayload}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function TaskSection({
  title,
  count,
  children
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
        {title} ({count})
      </h3>
      {children}
    </section>
  )
}

function EditButton({
  title,
  onClick
}: {
  title: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-label={`Editar ${title}`}
    >
      <Pencil />
    </Button>
  )
}

function DeleteButton({
  title,
  onClick
}: {
  title: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="destructive"
      size="icon"
      onClick={onClick}
      aria-label={`Remover ${title}`}
    >
      <Trash2 />
    </Button>
  )
}

function TaskList({
  items,
  onToggle,
  onEdit,
  onDelete
}: {
  items: MaintenanceTask[]
  onToggle: (task: MaintenanceTask) => void
  onEdit: (task: MaintenanceTask) => void
  onDelete: (task: MaintenanceTask) => void
}) {
  return (
    <ul className="divide-y rounded-md border">
      {items.map((task) => (
        <li key={task.id} className="flex items-center gap-2 pr-2">
          {/* O label inteiro é a área de clique para concluir */}
          <label
            htmlFor={`task-${task.id}`}
            className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 pl-3 hover:bg-muted/40"
          >
            <Checkbox
              id={`task-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={() => onToggle(task)}
              className="size-5 border-muted-foreground/70"
              aria-label={`Concluir ${task.title}`}
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
              <Badge variant="outline">
                {formatMonthYear(task.targetMonth, task.targetYear)}
              </Badge>
            )}
          </label>
          <EditButton title={task.title} onClick={() => onEdit(task)} />
          <DeleteButton title={task.title} onClick={() => onDelete(task)} />
        </li>
      ))}
    </ul>
  )
}

function RecurringTaskList({
  items,
  onDone,
  onEdit,
  onDelete
}: {
  items: MaintenanceTask[]
  onDone: (task: MaintenanceTask) => void
  onEdit: (task: MaintenanceTask) => void
  onDelete: (task: MaintenanceTask) => void
}) {
  return (
    <ul className="divide-y rounded-md border">
      {items.map((task) => {
        const due = formatDueDate(task.nextDueDate)
        const overdue = isOverdue(task.nextDueDate)

        return (
          <li
            key={task.id}
            className="flex flex-wrap items-center gap-2 px-3 py-2"
          >
            <div className="min-w-0 flex-1 basis-40">
              <span className="block truncate font-medium">{task.title}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {formatInterval(task.intervalDays)}
                {task.lastDoneAt &&
                  ` · feito em ${formatDueDate(task.lastDoneAt)}`}
              </span>
              {task.notes && (
                <span className="block truncate text-[11px] text-muted-foreground">
                  {task.notes}
                </span>
              )}
            </div>
            {due && (
              <Badge variant={overdue ? 'destructive' : 'outline'}>{due}</Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onDone(task)}
            >
              <Check />
              Feito
            </Button>
            <EditButton title={task.title} onClick={() => onEdit(task)} />
            <DeleteButton title={task.title} onClick={() => onDelete(task)} />
          </li>
        )
      })}
    </ul>
  )
}
