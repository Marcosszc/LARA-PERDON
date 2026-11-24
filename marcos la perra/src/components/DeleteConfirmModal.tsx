import { AlertTriangle } from 'lucide-react';
import type { PuntoAsistencia } from '../types/punto';

interface DeleteConfirmModalProps {
  punto: PuntoAsistencia | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  punto,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!punto) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-titulo"
    >
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 text-red-700 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 id="modal-delete-titulo" className="text-base font-semibold text-slate-900">
              Eliminar punto de asistencia
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              ¿Querés eliminar <span className="font-medium text-slate-900">{punto.nombre}</span>? Esta acción quitará el registro de la base de datos.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar punto'}
          </button>
        </div>
      </div>
    </div>
  );
}
