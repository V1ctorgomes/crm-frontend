import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import type { Ticket } from '../types';

interface TicketTasksTabProps {
  ticket: Ticket;
  onTicketUpdated: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
  setConfirmModal: (modal: any) => void;
}

/** Aba de lembretes (tasks) com lista + formulário de criação. */
export function TicketTasksTab({ ticket, onTicketUpdated, showFeedback, setConfirmModal }: TicketTasksTabProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;
    const dateWithTimezone = new Date(newTaskDate).toISOString();
    try {
      await apiRequest(`/tickets/${ticket.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title: newTaskTitle, dueDate: dateWithTimezone }),
      });
      setNewTaskTitle('');
      setNewTaskDate('');
      onTicketUpdated();
      showFeedback('success', 'Lembrete agendado!');
    } catch {
      showFeedback('error', 'Erro ao agendar lembrete.');
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await apiRequest(`/tickets/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });
      onTicketUpdated();
    } catch {
      showFeedback('error', 'Erro ao atualizar tarefa.');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmModal({
      title: 'Apagar Lembrete?',
      message: 'Tem a certeza que deseja apagar este lembrete?',
      onConfirm: async () => {
        try {
          await apiRequest(`/tickets/tasks/${taskId}`, { method: 'DELETE' });
          onTicketUpdated();
          showFeedback('success', 'Lembrete apagado.');
        } catch {
          showFeedback('error', 'Erro ao apagar.');
        }
        setConfirmModal(null);
      },
      onClose: () => setConfirmModal(null),
    });
  };

  const tasks = ticket.tasks || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
      <div className="flex-1 p-6 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Calendar className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">Sem agendamentos para esta OS.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => {
              const isOverdue = new Date(task.dueDate) < new Date() && !task.isCompleted;
              return (
                <div
                  key={task.id}
                  className={`bg-white p-4 rounded-lg border shadow-sm group flex items-start gap-4 transition-all ${
                    task.isCompleted
                      ? 'border-slate-200 opacity-60'
                      : isOverdue
                        ? 'border-red-200'
                        : 'border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <button
                    onClick={() => handleToggleTask(task.id, task.isCompleted)}
                    className={`mt-0.5 shrink-0 ${task.isCompleted ? 'text-brand-600' : 'text-slate-300 hover:text-brand-500'}`}
                  >
                    {task.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className={`text-[11px] font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                        {new Date(task.dueDate).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {isOverdue ? ' (Atrasado)' : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="O que precisa ser feito?"
            className="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-600"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <input
            type="datetime-local"
            className="sm:w-[200px] h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-brand-600"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || !newTaskDate}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-600 text-white h-10 px-6 disabled:opacity-50"
          >
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}
